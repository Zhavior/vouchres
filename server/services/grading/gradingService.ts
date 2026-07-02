import { getSupabaseAdmin } from "../../middleware/auth";
import { gradePick } from "../persistence/pickService";
import { createParlayGradedNotification } from "../notifications/notificationService";

/**
 * Grading service — resolves pick outcomes by fetching results from the
 * MLB Stats API and updating picks in Postgres.
 *
 * CRITICAL: This is the ONLY code path that can change a pick's status
 * from 'pending' to 'won'/'lost'/'push'. The client cannot grade picks.
 *
 * Run via:
 *   - Cron job (server/cron/dailyGradeJob.ts) — nightly at 2 AM ET
 *   - Manual staff trigger (POST /api/admin/grade-pending) — for re-grades
 *   - Realtime (future) — Supabase Realtime subscription to game final
 */

const MLB_API = process.env.MLB_API_BASE_URL ?? "https://statsapi.mlb.com/api";

export interface GradeResult {
  pick_id: string;
  status: "won" | "lost" | "push" | "void" | "graded_error";
  settled_units: number | null;
  learning_note?: string;
  error?: string;
  game_date?: string | null;
  warnings?: string[];
  leg_results?: Array<{
    leg_index: number;
    status: "won" | "lost" | "push";
    note?: string;
  }>;
}

export interface GradeRunSummary {
  total_pending: number;
  total_graded: number;
  wins: number;
  losses: number;
  pushes: number;
  voids: number;
  warnings: string[];
}

export interface GradeRunResult {
  graded: GradeResult[];
  skipped: GradeResult[];
  summary: GradeRunSummary;
}

interface FinalGameData {
  boxscore: any;
  game_date: string | null;
}


function isLikelyMlbGamePk(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  const text = String(value).trim();

  // MLB gamePk values are numeric. Legacy/local placeholders like
  // "leg-...", "ai-leg-...", "manual", or empty strings should never hit
  // the MLB linescore/boxscore endpoints.
  return /^\d{5,10}$/.test(text);
}

/**
 * Grade all pending picks whose event has concluded.
 *
 * Strategy:
 *   1. Query DB for picks with status='pending' and event_id is not null
 *   2. Group by event_id (one boxscore fetch per game)
 *   3. For each game: fetch boxscore, parse player stats, evaluate each pick
 *   4. Update each pick via gradePick()
 *
 * Idempotent: re-running on already-graded picks is a no-op (we only query
 * status='pending'). Safe to retry on transient failures.
 *
 * @param opts.days Look back N days for pending picks (default 3)
 * @param opts.dryRun If true, returns what would be graded without writing
 */
export async function gradePendingPicks(opts: {
  days?: number;
  dryRun?: boolean;
} = {}): Promise<GradeRunResult> {
  const supabaseAdmin = await getSupabaseAdmin();
  const days = opts.days ?? 3;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // 1. Fetch pending picks
  const { data: pending, error } = await supabaseAdmin
    .from("picks")
    .select("id, user_id, market, selection, event_id, odds_decimal, stake_units, leg_type, sport, created_at, graded_at, status")
    .eq("status", "pending")
    .not("event_id", "is", null)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(500);

  if (error) {
    console.error("[grading] fetch pending failed", error);
    throw error;
  }

  if (!pending || pending.length === 0) {
    return { graded: [], skipped: [], summary: summarizeGradeRun([], [], 0) };
  }

  // 2. Group by event_id
  const byEvent = new Map<string, typeof pending>();
  for (const pick of pending) {
    const key = pick.event_id as string;
    if (!byEvent.has(key)) byEvent.set(key, []);
    byEvent.get(key)!.push(pick);
  }

  const graded: GradeResult[] = [];
  const skipped: GradeResult[] = [];

  // 3. Process each event
  for (const [eventId, picks] of byEvent) {
    if (!isLikelyMlbGamePk(eventId)) {
      const message = `legacy/manual event id skipped (${eventId})`;
      console.log(`[grading] skipping event ${eventId}: ${message}`);
      for (const pick of picks) {
        skipped.push({
          pick_id: pick.id,
          status: "graded_error",
          settled_units: null,
          error: message,
          warnings: [message],
        });
      }
      continue;
    }

    let gameData: FinalGameData;
    try {
      gameData = await fetchBoxscore(eventId);
    } catch (err: any) {
      // Game not final yet, or fetch failed — skip all picks for this event
      console.log(`[grading] skipping event ${eventId}: ${err.message}`);
      for (const pick of picks) {
        skipped.push({
          pick_id: pick.id,
          status: "graded_error",
          settled_units: null,
          error: err.message,
          warnings: [`Game data missing for event ${eventId}: ${err.message}`],
        });
      }
      continue;
    }

    // 4. Evaluate each pick
    for (const pick of picks) {
      try {
        const result = await evaluatePick(pick, gameData.boxscore);
        result.game_date = gameData.game_date ?? String(pick.created_at ?? "").slice(0, 10) ?? null;
        if (!gameData.game_date) {
          result.warnings = [
            ...(result.warnings ?? []),
            "MLB linescore did not include game_date; using pick created_at date as fallback.",
          ];
        }

        if (result.status === "graded_error") {
          skipped.push({ ...result, pick_id: pick.id });
          continue;
        }

        if (!opts.dryRun) {
          const changed = await gradePick({
            pickId: pick.id,
            status: result.status,
            settledUnits: result.settled_units,
            learningNote: result.learning_note,
            gameDate: result.game_date,
          });
          if (!changed) {
            skipped.push({
              pick_id: pick.id,
              status: "graded_error",
              settled_units: null,
              error: "already_graded_or_missing",
              warnings: ["Pick was no longer pending when grading attempted."],
            });
            continue;
          }
          if (result.leg_results?.length) {
            await applyParlayLegGrades(pick.id, result.leg_results, result.game_date);
          }
          if (pick.leg_type === "parlay" && pick.user_id) {
            const legResults = result.leg_results ?? [];
            const notify = await createParlayGradedNotification({
              userId: String(pick.user_id),
              parlayId: pick.id,
              status: result.status,
              legCount: legResults.length || 1,
              wins: legResults.filter((leg) => leg.status === "won").length || (result.status === "won" ? 1 : 0),
              losses: legResults.filter((leg) => leg.status === "lost").length || (result.status === "lost" ? 1 : 0),
              pushes: legResults.filter((leg) => leg.status === "push").length || (result.status === "push" ? 1 : 0),
              voids: result.status === "void" ? 1 : 0,
            });
            result.warnings = [...(result.warnings ?? []), ...notify.warnings];
          }
        }

        graded.push({ ...result, pick_id: pick.id });
      } catch (err: any) {
        console.error(`[grading] pick ${pick.id} failed`, err);
        skipped.push({
          pick_id: pick.id,
          status: "graded_error",
          settled_units: null,
          error: err.message,
        });
      }
    }
  }

  console.log(
    `[grading] done: ${graded.length} graded, ${skipped.length} skipped (of ${pending.length} pending)`
  );

  return { graded, skipped, summary: summarizeGradeRun(graded, skipped, pending.length) };
}

/**
 * Fetch the boxscore for a game. Throws if the game is not yet final.
 * Uses linescore endpoint to verify finality before fetching player stats.
 */
async function fetchBoxscore(gamePk: string): Promise<FinalGameData> {
  // Step 1: live feed status is more reliable than linescore.isComplete.
  // Some MLB linescore responses do not expose a top-level isComplete flag,
  // which caused final games to stay stuck as "isComplete=undefined".
  const feedRes = await fetch(`${MLB_API}/v1.1/game/${gamePk}/feed/live`, {
    signal: AbortSignal.timeout(10_000),
    headers: { "User-Agent": "VouchEdge/1.0 (grading service)" },
  });

  if (!feedRes.ok) throw new Error(`feed fetch ${feedRes.status}`);

  const feed = await feedRes.json();
  const status = feed?.gameData?.status || {};
  const abstractState = String(status?.abstractGameState || "").toLowerCase();
  const detailedState = String(status?.detailedState || "").toLowerCase();
  const codedState = String(status?.codedGameState || "").toUpperCase();

  const isFinal =
    abstractState === "final" ||
    detailedState.includes("final") ||
    detailedState.includes("completed") ||
    detailedState.includes("official") ||
    codedState === "F";

  if (!isFinal) {
    throw new Error(
      `game not final (abstract=${status?.abstractGameState ?? "unknown"}, detailed=${status?.detailedState ?? "unknown"}, coded=${status?.codedGameState ?? "unknown"})`
    );
  }

  const gameDate =
    typeof feed?.gameData?.datetime?.officialDate === "string"
      ? feed.gameData.datetime.officialDate
      : typeof feed?.gameData?.datetime?.originalDate === "string"
        ? feed.gameData.datetime.originalDate
        : null;

  // Step 2: boxscore for player batting stats
  const bsRes = await fetch(`${MLB_API}/v1/game/${gamePk}/boxscore`, {
    signal: AbortSignal.timeout(10_000),
    headers: { "User-Agent": "VouchEdge/1.0 (grading service)" },
  });
  if (!bsRes.ok) throw new Error(`boxscore fetch ${bsRes.status}`);
  return { boxscore: await bsRes.json(), game_date: gameDate };
}

/**
 * Evaluate a single pick against the boxscore.
 *
 * Supports the markets used by VouchEdge cappers:
 *   - 'hr'         — player to hit 1+ HR (over 0.5)
 *   - 'hr_multi'   — player to hit 2+ HR (over 1.5)
 *   - 'rbi'        — player to record 1+ RBI (over 0.5)
 *   - 'rbi_over'   — player RBI over X.X
 *   - 'run'        — player to score 1+ run (over 0.5)
 *   - 'parlay'     — multi-leg parlay (each leg must win)
 *
 * New markets can be added here as the capper agents evolve.
 */
async function evaluatePick(
  pick: {
    id: string;
    market: string;
    selection: string;
    odds_decimal: number | null;
    stake_units: number | null;
    leg_type: string;
    event_id?: string | null;
    sport?: string | null;
  },
  boxscore: any
): Promise<GradeResult> {
  const market = pick.market.toLowerCase();
  const selection = pick.selection;

  // Future-proof for NBA/NFL: non-MLB picks defer to the sport grader registry.
  // Until those graders exist they're left pending (skipped) rather than being
  // mis-graded by MLB boxscore logic. See server/services/grading/sportGraders.ts.
  const sport = (pick.sport ?? "mlb").toLowerCase();
  if (sport !== "mlb") {
    return {
      pick_id: pick.id,
      status: "graded_error",
      settled_units: null,
      error: `sport_not_yet_supported:${sport}`,
    };
  }

  const playerName = extractPlayerName(selection, market);

  if (market === "hr" || market === "hr_multi") {
    const threshold = market === "hr_multi" ? 2 : 1;
    const playerHrs = countPlayerStat(boxscore, playerName, "homeRuns");
    return settlePick(pick, playerHrs >= threshold);
  }

  if (market === "rbi" || market === "rbi_over") {
    const playerRbis = countPlayerStat(boxscore, playerName, "rbi");
    const threshold = market === "rbi_over" ? extractThreshold(selection) : 1;
    return settlePick(pick, playerRbis >= threshold);
  }

  if (market === "run") {
    const playerRuns = countPlayerStat(boxscore, playerName, "runs");
    return settlePick(pick, playerRuns >= 1);
  }

  if (pick.leg_type === "parlay" || market.includes("parlay")) {
    // Parlays: load the legs from pick_legs, grade each leg individually.
    // - Any leg LOST → parlay LOST
    // - All legs WON → parlay WON, payout = stake * product(odds)
    // - Mix of WON and PUSH → parlay PUSH if all remaining WON,
    //   else LOST (push legs reduce the effective parlay size)
    // - All legs PUSH → parlay PUSH, refund stake
    return await gradeParlayPick(pick, boxscore);
  }

  return {
    pick_id: pick.id,
    status: "graded_error",
    settled_units: null,
    error: `unknown_market:${market}`,
  };
}

/**
 * Grade a parlay pick by evaluating each leg.
 *
 * Loads legs from pick_legs table, evaluates each as a single pick,
 * then combines per standard parlay rules.
 */
async function gradeParlayPick(
  pick: {
    id: string;
    market: string;
    selection: string;
    odds_decimal: number | null;
    stake_units: number | null;
    event_id?: string | null;
  },
  boxscore: any
): Promise<GradeResult> {
  const supabaseAdmin = await getSupabaseAdmin();
  // 1. Load legs
  const { data: legs, error } = await supabaseAdmin
    .from("pick_legs")
    .select("leg_index, market, selection, event_id, game_id, market_code, player_id, event_key, odds_decimal")
    .eq("pick_id", pick.id)
    .order("leg_index", { ascending: true });

  if (error || !legs || legs.length === 0) {
    return {
      pick_id: pick.id,
      status: "graded_error",
      settled_units: null,
      error: "parlay_no_legs",
    };
  }

  // 2. Group legs by event_id — fetch each unique boxscore once
  const eventIds = [...new Set(legs.map((l: any) => l.event_id).filter(Boolean))] as string[];
  const boxscoreCache = new Map<string, any>();

  for (const eventId of eventIds) {
    if (!isLikelyMlbGamePk(eventId)) {
      return {
        pick_id: pick.id,
        status: "graded_error",
        settled_units: null,
        error: `legacy_manual_leg_event_skipped:${eventId}`,
        warnings: [`legacy/manual leg event id skipped (${eventId})`],
      };
    }

    try {
      // If this leg's event matches the parlay's parent event, reuse the boxscore
      if (eventId === (pick as any).event_id?.toString()) {
        boxscoreCache.set(eventId, boxscore);
        continue;
      }
      const legBoxscore = await fetchBoxscore(eventId);
      boxscoreCache.set(eventId, legBoxscore);
    } catch (err: any) {
      // Any leg's game not final → can't grade parlay yet
      return {
        pick_id: pick.id,
        status: "graded_error",
        settled_units: null,
        error: `parlay_leg_event_not_final:${eventId}: ${err.message}`,
      };
    }
  }

  // 3. Evaluate each leg
  const legResults: Array<{ leg_index: number; status: "won" | "lost" | "push"; odds: number; note?: string }> = [];

  for (const leg of legs) {
    const legBoxscore = leg.event_id ? boxscoreCache.get(leg.event_id as string) : boxscore;
    if (!legBoxscore) {
      return {
        pick_id: pick.id,
        status: "graded_error",
        settled_units: null,
        error: `parlay_leg_no_boxscore:${leg.leg_index}`,
      };
    }

    // Reuse the single-pick evaluation logic for this leg
    const legResult = await evaluatePick(
      {
        id: pick.id,
        market: leg.market,
        selection: leg.selection,
        odds_decimal: leg.odds_decimal ?? null,
        stake_units: 1.0, // not used for individual leg eval
        leg_type: "single",
      },
      legBoxscore
    );

    if (legResult.status === "graded_error") {
      return {
        pick_id: pick.id,
        status: "graded_error",
        settled_units: null,
        error: `parlay_leg_${leg.leg_index}_error: ${legResult.error}`,
      };
    }

    legResults.push({
      leg_index: Number(leg.leg_index),
      status: legResult.status as "won" | "lost" | "push",
      odds: leg.odds_decimal ?? 2.0,
      note: legResult.learning_note ?? legResult.error,
    });
  }

  // 4. Combine leg results into parlay outcome
  const stake = pick.stake_units ?? 1.0;

  // Any leg LOST → parlay LOST
  if (legResults.some((r) => r.status === "lost")) {
    return {
      pick_id: pick.id,
      status: "lost",
      settled_units: -Number(stake.toFixed(2)),
      learning_note: `Parlay lost: ${legResults.filter(r => r.status === "lost").length} leg(s) lost.`,
      leg_results: legResults.map(({ leg_index, status, note }) => ({ leg_index, status, note })),
    };
  }

  // Filter out pushes — they reduce the effective parlay size
  const wonLegs = legResults.filter((r) => r.status === "won");
  const pushLegs = legResults.filter((r) => r.status === "push");

  // All legs pushed → refund stake
  if (wonLegs.length === 0) {
    return {
      pick_id: pick.id,
      status: "push",
      settled_units: 0.0,
      learning_note: `Parlay pushed: all ${pushLegs.length} leg(s) pushed.`,
      leg_results: legResults.map(({ leg_index, status, note }) => ({ leg_index, status, note })),
    };
  }

  // All remaining legs won → parlay won
  // Payout = stake * product(wonLegs.odds)
  // (Standard parlay math: pushes reduce leg count but don't lose)
  const combinedOdds = wonLegs.reduce((product, leg) => product * leg.odds, 1);
  const payout = Number((stake * (combinedOdds - 1)).toFixed(2));

  return {
    pick_id: pick.id,
    status: "won",
    settled_units: payout,
    learning_note:
      pushLegs.length > 0
        ? `Parlay won with ${pushLegs.length} push(es). Effective ${wonLegs.length}-leg parlay at combined odds ${combinedOdds.toFixed(2)}.`
        : `Parlay won. ${wonLegs.length}-leg parlay at combined odds ${combinedOdds.toFixed(2)}.`,
    leg_results: legResults.map(({ leg_index, status, note }) => ({ leg_index, status, note })),
  };
}

async function applyParlayLegGrades(
  pickId: string,
  legResults: NonNullable<GradeResult["leg_results"]>,
  gameDate?: string | null
): Promise<void> {
  const supabaseAdmin = await getSupabaseAdmin();
  const gradedAt = new Date().toISOString();
  for (const leg of legResults) {
    const buildUpdate = (includeGameDate: boolean) => ({
      status: leg.status,
      graded_at: gradedAt,
      ...(includeGameDate && gameDate ? { game_date: gameDate } : {}),
    });
    let result = await supabaseAdmin
      .from("pick_legs")
      .update(buildUpdate(true))
      .eq("pick_id", pickId)
      .eq("leg_index", leg.leg_index)
      .eq("status", "pending");
    if (result.error && ["42703", "PGRST204"].includes(result.error.code)) {
      result = await supabaseAdmin
        .from("pick_legs")
        .update(buildUpdate(false))
        .eq("pick_id", pickId)
        .eq("leg_index", leg.leg_index)
        .eq("status", "pending");
    }
    if (result.error) {
      console.warn(`[grading] leg update failed pick=${pickId} leg=${leg.leg_index}`, result.error.message);
    }
  }
}

export function summarizeGradeRun(
  graded: GradeResult[],
  skipped: GradeResult[],
  initialPending: number
): GradeRunSummary {
  const wins = graded.filter((r) => r.status === "won").length;
  const losses = graded.filter((r) => r.status === "lost").length;
  const pushes = graded.filter((r) => r.status === "push").length;
  const voids = graded.filter((r) => r.status === "void").length;
  const warnings = [
    ...graded.flatMap((r) => r.warnings ?? []),
    ...skipped.flatMap((r) => r.warnings ?? []),
    ...(skipped.map((r) => r.error).filter(Boolean) as string[]),
  ];
  return {
    total_pending: Math.max(0, initialPending - graded.length),
    total_graded: graded.length,
    wins,
    losses,
    pushes,
    voids,
    warnings: [...new Set(warnings)],
  };
}

/**
 * Settle a pick based on whether it won.
 */
function settlePick(
  pick: { id: string; odds_decimal: number | null; stake_units: number | null },
  won: boolean
): GradeResult {
  const stake = pick.stake_units ?? 1.0;
  const odds = pick.odds_decimal ?? 2.0;

  if (won) {
    const settled = Number((stake * (odds - 1)).toFixed(2));
    return {
      pick_id: pick.id,
      status: "won",
      settled_units: settled,
      learning_note: `Won at ${odds.toFixed(2)} odds.`,
    };
  } else {
    return {
      pick_id: pick.id,
      status: "lost",
      settled_units: -Number(stake.toFixed(2)),
      learning_note: `Lost at ${odds.toFixed(2)} odds.`,
    };
  }
}

function extractPlayerName(selection: string, _market: string): string {
  const cleaned = selection
    .replace(/\b\d+\+?\s*(HR|RBI|RUN|RUNS)\b/i, "")
    .replace(/\b(HR|RBI|RUN|RUNS)\b/i, "")
    .replace(/\bover\s+[\d.]+\b/i, "")
    .trim();
  return cleaned;
}

function extractThreshold(selection: string): number {
  const match = selection.match(/over\s+(\d+\.?\d*)/i);
  return match ? parseFloat(match[1]) : 1;
}

function countPlayerStat(boxscore: any, playerName: string, stat: string): number {
  if (!boxscore?.teams) return 0;
  const nameLower = playerName.toLowerCase();

  for (const side of ["away", "home"]) {
    const players = boxscore.teams[side]?.players;
    if (!players) continue;

    for (const playerKey of Object.keys(players)) {
      const p = players[playerKey];
      const fullName = p?.person?.fullName?.toLowerCase();
      if (!fullName) continue;

      if (fullName === nameLower || fullName.endsWith(" " + nameLower)) {
        const statValue = p?.stats?.batting?.[stat];
        return typeof statValue === "number" ? statValue : 0;
      }
    }
  }

  return 0;
}
