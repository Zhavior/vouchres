/**
 * HR pregame snapshot capture (HR-M1, Batch 3).
 *
 * Runs every 5 minutes during the season. Most runs do nothing — that is
 * intended. When a game enters its capture window, the slate's validated board
 * is written down as it stood before first pitch.
 *
 * Pregame features are the only irrecoverable asset here: once a game starts,
 * every season-to-date statistic contains the outcome we are trying to predict,
 * so a slate that was not captured is gone permanently. That asymmetry drives
 * the design — capture early and imperfectly rather than late and never.
 *
 * SCHEDULING
 *   Render Cron Job:  every 5 minutes  ->  node dist/hrSnapshotCapture.cjs
 *   or invoke via:    npm run hr:snapshot
 *
 * FLAGS
 *   --dry-run              build and report rows, write nothing
 *   --game-pk=<id>         restrict to a single game (first live run)
 *   --force-game-pk=<id>   DRY-RUN ONLY. Inspect one game outside its capture
 *                          window. Refused on a writing run, and never bypasses
 *                          the post-first-pitch rule.
 *   --date=YYYY-MM-DD      override the slate date (testing)
 */

import { createHash } from "node:crypto";
import {
  buildValidatedHrBoard,
  officialStartersFromBoxscoreTeam,
} from "../services/mlb/hrPipeline";
import { getBoxscore, getScheduleByDate } from "../services/mlb/mlbClient";
import { decideCapture } from "../services/hr-history/captureWindow";
import {
  buildSnapshotRows,
  findCapturedGamePks,
  insertSnapshotRows,
} from "../services/hr-history/snapshotWriter";
import type { GameScheduleContext } from "../services/hr-history/snapshotTypes";

interface Flags {
  dryRun: boolean;
  gamePk: string | null;
  /** Dry-run only. Inspect one game outside its capture window. */
  forceGamePk: string | null;
  date: string | null;
}

function parseFlags(argv: string[]): Flags {
  const value = (name: string): string | null => {
    const hit = argv.find((arg) => arg.startsWith(`--${name}=`));
    return hit ? hit.slice(name.length + 3) : null;
  };
  return {
    dryRun: argv.includes("--dry-run"),
    gamePk: value("game-pk"),
    forceGamePk: value("force-game-pk"),
    date: value("date"),
  };
}

/**
 * --force-game-pk is an inspection aid, not a capture mode. Allowing it on a
 * writing run would let a snapshot be persisted from outside the window the
 * capture rules define, so it is refused before anything else happens.
 */
function assertForceIsDryRunOnly(flags: Flags): void {
  if (flags.forceGamePk && !flags.dryRun) {
    throw new Error(
      "--force-game-pk requires --dry-run. It may never be used on a run that writes to the database.",
    );
  }
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Stage timing. Every external call is bracketed so a stall names itself. */
const T0 = Date.now();
function stage(message: string): void {
  console.log(`[HR_SNAPSHOT][+${((Date.now() - T0) / 1000).toFixed(1)}s] ${message}`);
}

/**
 * Fail loudly instead of hanging. The pipeline's fetch helpers do not all
 * carry a deadline, and an unbounded external call in a cron is indistinguishable
 * from a crash.
 */
async function withTimeout<T>(label: string, ms: number, work: Promise<T>): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} exceeded ${ms}ms — aborting rather than hanging`)),
      ms,
    );
  });
  try {
    return await Promise.race([work, deadline]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const SCHEDULE_TIMEOUT_MS = 60_000;
const BOARD_TIMEOUT_MS = 300_000;
const BOXSCORE_TIMEOUT_MS = 30_000;

/**
 * Confirmed batting orders for the games being captured, read from each game's
 * boxscore — the authoritative lineup at capture time.
 *
 * Deliberately not taken from the validated board: its `pool` summary omits
 * `players`, and widening that object would inflate every locally cached and
 * Redis-persisted HR board payload (hrBoardHub.ts:549) for the sake of one
 * field only this job needs.
 *
 * A game whose lineup is not yet posted simply contributes nothing — every
 * batting_order for it stays null rather than being guessed.
 */
async function loadBattingOrders(gamePks: string[]): Promise<Map<string, number>> {
  const orders = new Map<string, number>();

  for (const gamePk of gamePks) {
    try {
      const boxscore = await withTimeout(
        `getBoxscore(${gamePk})`,
        BOXSCORE_TIMEOUT_MS,
        getBoxscore(Number(gamePk)),
      );
      const teams = (boxscore as { teams?: { home?: unknown; away?: unknown } } | null)?.teams;

      for (const side of [teams?.home, teams?.away]) {
        for (const [playerId, spot] of officialStartersFromBoxscoreTeam(side)) {
          orders.set(String(playerId), spot);
        }
      }
    } catch (error) {
      console.warn(
        `[HR_SNAPSHOT] boxscore unavailable game=${gamePk} — batting_order stays null: ` +
          `${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return orders;
}

/** The commit this capture came from — part of the snapshot's provenance. */
function pipelineVersion(): string {
  return (
    process.env.RENDER_GIT_COMMIT ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GIT_COMMIT ??
    "unknown"
  );
}

/**
 * Game-level context the board does not return. Sourced from the schedule feed
 * so hrPipeline.ts stays untouched.
 */
async function loadGameContexts(
  date: string,
): Promise<{ contexts: Map<string, GameScheduleContext>; scheduleCount: number }> {
  stage(`getScheduleByDate(${date}) start`);
  const games = await withTimeout(
    "getScheduleByDate",
    SCHEDULE_TIMEOUT_MS,
    getScheduleByDate(date),
  );
  stage(`getScheduleByDate done — ${(games as unknown[]).length} game(s)`);

  const contexts = new Map<string, GameScheduleContext>();
  const dropped: string[] = [];

  for (const game of games) {
    const gamePk = game.gamePk != null ? String(game.gamePk) : null;
    const firstPitch = game.gameDate ?? null;
    const homeTeamId = game.homeTeam?.teamId ?? null;
    const awayTeamId = game.awayTeam?.teamId ?? null;

    // Every one of these is required to establish point-in-time integrity or to
    // satisfy a NOT NULL column. A game missing any of them is reported and
    // skipped rather than captured with a placeholder.
    if (!gamePk || !firstPitch || homeTeamId == null || awayTeamId == null) {
      dropped.push(
        `${gamePk ?? "?"}(first_pitch=${firstPitch ? "y" : "n"} ` +
          `home=${homeTeamId ?? "null"} away=${awayTeamId ?? "null"})`,
      );
      continue;
    }

    contexts.set(gamePk, {
      gamePk,
      homeTeamId: String(homeTeamId),
      awayTeamId: String(awayTeamId),
      venue: game.venue ?? null,
      scheduledFirstPitch: new Date(firstPitch).toISOString(),
    });
  }

  // Silence here previously turned a field-mapping bug into "no games on the
  // schedule", so a drop is always reported.
  if (dropped.length > 0) {
    console.warn(
      `[HR_SNAPSHOT] dropped ${dropped.length} scheduled game(s) missing required ` +
        `context: ${dropped.join(", ")}`,
    );
  }

  stage(`game contexts usable: ${contexts.size} of ${games.length} scheduled`);
  return { contexts, scheduleCount: games.length };
}

/**
 * Why nothing was selected. "no games due" covered five distinct situations,
 * and a forced run that silently selects nothing is indistinguishable from a
 * broken flag — so each case names itself.
 */
function explainNothingDue(
  flags: Flags,
  contexts: Map<string, GameScheduleContext>,
  perGame: Array<{ gamePk: string; reason: string }>,
): string {
  if (flags.forceGamePk) {
    if (!contexts.has(flags.forceGamePk)) {
      const available = [...contexts.keys()].join(", ");
      return `forced game ${flags.forceGamePk} is not on this slate — available: ${available}`;
    }
    const outcome = perGame.find((entry) => entry.gamePk === flags.forceGamePk);
    switch (outcome?.reason) {
      case "first_pitch_passed":
        return `forced game ${flags.forceGamePk} refused — first pitch has passed ` +
          `(force never bypasses the post-first-pitch rule)`;
      case "already_captured":
        return `forced game ${flags.forceGamePk} refused — already captured`;
      default:
        return `forced game ${flags.forceGamePk} produced no capture (reason=${outcome?.reason ?? "unevaluated"})`;
    }
  }

  if (flags.gamePk && !contexts.has(flags.gamePk)) {
    return `game ${flags.gamePk} is not on this slate`;
  }

  return `no games in the capture window — nothing to do`;
}

export async function runSnapshotCapture(flags: Flags): Promise<void> {
  // Checked here as well as at argv parse time, so an in-process caller cannot
  // reach a writing run with force set.
  assertForceIsDryRunOnly(flags);

  const now = new Date();
  const slateDate = flags.date ?? todayISO();
  const label = flags.dryRun ? "[HR_SNAPSHOT][dry-run]" : "[HR_SNAPSHOT]";

  // The effective selection, not just --game-pk: a forced run selects exactly
  // one game and the startup line has to say which.
  const selectedGame = flags.forceGamePk ?? flags.gamePk ?? "all";
  stage(
    `run start — modules loaded, slate=${slateDate} dry_run=${flags.dryRun} ` +
      `game_pk=${selectedGame}${flags.forceGamePk ? " (forced)" : ""}`,
  );

  const { contexts, scheduleCount } = await loadGameContexts(slateDate);
  if (contexts.size === 0) {
    console.log(
      scheduleCount === 0
        ? `${label} ${slateDate}: no games on the schedule — nothing to do`
        : `${label} ${slateDate}: ${scheduleCount} game(s) scheduled but none carried ` +
          `usable context (see dropped-game warning above) — nothing to do`,
    );
    return;
  }

  // Supabase is imported dynamically and only outside dry-run, so a dry run
  // provably cannot initialize a client, read, or insert.
  let db: Awaited<ReturnType<typeof import("../middleware/auth").getSupabaseAdmin>> | null = null;
  let alreadyCaptured = new Set<string>();

  if (flags.dryRun) {
    stage("dry-run — Supabase not initialized, no reads, no writes");
  } else {
    stage("supabase admin client init");
    const { getSupabaseAdmin } = await import("../middleware/auth");
    db = await getSupabaseAdmin();
    stage("already-captured lookup start");
    alreadyCaptured = await findCapturedGamePks(db, slateDate);
    stage(`already-captured lookup done — ${alreadyCaptured.size} game(s)`);
  }

  // Decide before building the board — the board is the expensive part.
  const due: string[] = [];
  const decisions: Record<string, number> = {};
  const perGame: Array<{ gamePk: string; reason: string; firstPitch: string }> = [];

  // --force-game-pk narrows the slate to that one game, the same way --game-pk
  // does; it additionally relaxes the window for it.
  const restrictTo = flags.gamePk ?? flags.forceGamePk;

  for (const [gamePk, context] of contexts) {
    if (restrictTo && gamePk !== restrictTo) continue;

    const forced = flags.forceGamePk === gamePk && flags.dryRun;
    const decision = decideCapture({
      now,
      scheduledFirstPitch: new Date(context.scheduledFirstPitch),
      alreadyCaptured: alreadyCaptured.has(gamePk),
      forceDryRun: forced,
    });

    if (decision.reason === "forced_dry_run") {
      console.warn(
        `${label} FORCED dry-run outside capture window — game=${gamePk} ` +
          `first_pitch=${context.scheduledFirstPitch} ` +
          `(inspection only; the post-first-pitch rule still applies)`,
      );
    }
    if (forced && !decision.capture) {
      console.warn(
        `${label} force requested but refused — game=${gamePk} reason=${decision.reason}`,
      );
    }

    decisions[decision.reason] = (decisions[decision.reason] ?? 0) + 1;
    perGame.push({
      gamePk,
      reason: decision.reason,
      firstPitch: context.scheduledFirstPitch,
    });
    if (decision.capture) due.push(gamePk);
  }

  console.log(
    `${label} ${slateDate}: ${contexts.size} games, decisions ${JSON.stringify(decisions)}`,
  );

  // Per-game reasons, before any early return, so a dry run that selects
  // nothing still explains itself game by game.
  if (flags.dryRun) {
    console.log(`${label} per-game decisions (${perGame.length}):`);
    for (const entry of perGame) {
      console.log(
        `${label}   game=${entry.gamePk} reason=${entry.reason} first_pitch=${entry.firstPitch}`,
      );
    }
  }

  if (due.length === 0) {
    console.log(`${label} ${slateDate}: ${explainNothingDue(flags, contexts, perGame)}`);
    return;
  }

  stage(`buildValidatedHrBoard(${slateDate}) start — ${due.length} game(s) due`);
  const board = await withTimeout(
    "buildValidatedHrBoard",
    BOARD_TIMEOUT_MS,
    buildValidatedHrBoard(slateDate),
  );
  // `pool` is typed as TodayPlayerPool but the pipeline returns a summary object
  // without `players` or `lastRefresh` (hrPipeline.ts:1269). Read defensively
  // rather than trusting the declared type — and never crash the capture over a
  // log line.
  const poolPlayers = (board.pool as { players?: unknown[] }).players;
  const boardRefreshedAt = (board.pool as { lastRefresh?: string }).lastRefresh ?? null;

  stage(
    `buildValidatedHrBoard done — ${board.candidates?.length ?? 0} confirmed, ` +
      `${board.projectedCandidates?.length ?? 0} projected, ` +
      `${poolPlayers?.length ?? "n/a"} pooled`,
  );

  const candidates = [...board.candidates, ...board.projectedCandidates].filter((c) =>
    due.includes(String(c.gamePk)),
  );
  stage(`candidates for due games: ${candidates.length}`);

  stage(`batting order lookup start — ${due.length} boxscore(s)`);
  const battingOrders = await loadBattingOrders(due);
  stage(`batting orders resolved: ${battingOrders.size}`);
  if (battingOrders.size === 0) {
    // Announced, not swallowed: batting_order is the basis of expected plate
    // appearances later, so capturing it as null across the board is a real
    // gap in the stored data, not a cosmetic one.
    console.warn(
      `${label} no confirmed batting orders found — batting_order will be null on every row`,
    );
  }

  stage("row transformation start");
  const { rows, skippedNoGameContext } = buildSnapshotRows({
    slateDate,
    candidates,
    gameContexts: contexts,
    battingOrders,
    capturedAt: now,
    // The board is cached for 5 minutes; lastRefresh is when it was actually
    // computed, which makes that staleness measurable rather than invisible.
    boardGeneratedAt: boardRefreshedAt,
    pipelineVersion: pipelineVersion(),
    sourceAsOf: {
      schedule: now.toISOString(),
      board: boardRefreshedAt ?? undefined,
    },
  });

  stage(`row transformation done — ${rows.length} row(s)`);

  // The board-cache age gate: how stale the board was when it was captured.
  const boardAgeMs = boardRefreshedAt
    ? now.getTime() - new Date(boardRefreshedAt).getTime()
    : null;
  console.log(
    `${label} board_generated_at=${boardRefreshedAt ?? "null"} ` +
      `captured_at=${now.toISOString()} ` +
      `board_age=${boardAgeMs == null ? "unknown" : `${(boardAgeMs / 1000).toFixed(1)}s`} ` +
      `batting_order_populated=${rows.filter((row) => row.batting_order != null).length}/${rows.length}`,
  );

  const lineupStatusCounts: Record<string, number> = {};
  for (const row of rows) {
    lineupStatusCounts[row.lineup_status] = (lineupStatusCounts[row.lineup_status] ?? 0) + 1;
  }
  const notPointInTime = rows.filter((row) => !row.is_point_in_time).length;

  console.log(
    `${label} games_due=${due.length} rows=${rows.length} ` +
      `lineup_status=${JSON.stringify(lineupStatusCounts)} ` +
      `not_point_in_time=${notPointInTime} skipped_no_context=${skippedNoGameContext}`,
  );

  if (flags.dryRun) {
    // Per-game counts + the selected game list, so a dry run can be checked
    // against the actual slate rather than trusted in aggregate.
    const byGame = new Map<string, number>();
    for (const row of rows) byGame.set(row.game_pk, (byGame.get(row.game_pk) ?? 0) + 1);

    console.log(`${label} selected games (${due.length}):`);
    for (const gamePk of due) {
      const context = contexts.get(gamePk);
      console.log(
        `${label}   game=${gamePk} rows=${byGame.get(gamePk) ?? 0} ` +
          `venue=${context?.venue ?? "?"} first_pitch=${context?.scheduledFirstPitch ?? "?"}`,
      );
    }

    // One digest over every row's identity + feature hash. Two dry runs against
    // the same board must produce the same digest; a single differing feature
    // changes it. Cheaper to compare than diffing hundreds of hashes by eye.
    const digest = createHash("sha256")
      .update(
        rows
          .map((row) => `${row.game_pk}|${row.player_id}|${row.feature_hash}`)
          .sort()
          .join("\n"),
      )
      .digest("hex");

    console.log(`${label} slate_digest=${digest}`);
    console.log(`${label} dry run — no rows written`);
    return;
  }

  // A post-first-pitch row should be unreachable: decideCapture refuses those
  // games. If one appears anyway (clock skew, a schedule revision mid-run),
  // stop rather than persist a contaminated snapshot.
  if (notPointInTime > 0) {
    throw new Error(
      `${label} refusing to write ${notPointInTime} row(s) with is_point_in_time=false`,
    );
  }

  // Per game, so a crash mid-slate leaves earlier games captured.
  let written = 0;
  for (const gamePk of due) {
    const gameRows = rows.filter((row) => row.game_pk === gamePk);
    if (gameRows.length === 0) continue;
    try {
      written += await insertSnapshotRows(db!, gameRows);
      console.log(`${label} game=${gamePk} rows=${gameRows.length} ok`);
    } catch (error) {
      console.error(`${label} game=${gamePk} insert failed:`, error);
    }
  }

  console.log(`${label} ${slateDate}: wrote ${written} row(s)`);
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2));
  try {
    await runSnapshotCapture(flags);
    process.exit(0);
  } catch (error) {
    console.error("[HR_SNAPSHOT] capture failed:", error);
    process.exit(1);
  }
}

// Only self-invoke when run directly, so importing this module in a test or
// from the server process does not fire a capture.
if (process.argv[1] && process.argv[1].includes("hrSnapshotCapture")) {
  void main();
}
