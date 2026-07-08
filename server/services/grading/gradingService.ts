import { AppError } from "../../errors/AppError";
import { getSupabaseAdmin } from "../../middleware/auth";
import { sportsFetchJson } from "../../lib/sports/sportsHttpClient";
import { gradePick } from "../persistence/pickService";
import { createParlayGradedNotification } from "../notifications/notificationService";
import { formatMlbStatus, isMlbFinalStatusText } from "../mlb/gameStatus";

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
 * Process-local lock so concurrent cron/staff grade runs don't race-settle
 * the same pending picks on a single instance. Cross-instance coordination
 * still requires Redis/DB locking in production multi-node.
 */
let gradePendingInflight: Promise<GradeRunResult> | null = null;

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
 * Concurrent callers on this process await the same in-flight run to prevent
 * double-settlement races; dryRun always executes a fresh read-only pass.
 *
 * @param opts.days Look back N days for pending picks (default 3)
 * @param opts.dryRun If true, returns what would be graded without writing
 */
export async function gradePendingPicks(opts: {
  days?: number;
  dryRun?: boolean;
} = {}): Promise<GradeRunResult> {
  if (opts.dryRun) {
    return runGradePendingPicks(opts);
  }

  if (gradePendingInflight) {
    return gradePendingInflight;
  }

  gradePendingInflight = runGradePendingPicks(opts).finally(() => {
    gradePendingInflight = null;
  });
  return gradePendingInflight;
}

async function runGradePendingPicks(opts: {
  days?: number;
  dryRun?: boolean;
} = {}): Promise<GradeRunResult> {
  const supabaseAdmin = await getSupabaseAdmin();
  const days = opts.days ?? 3;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // 1. Fetch pending picks
  const { data: pending, error } = await supabaseAdmin
    .from("picks")
    .select("id, user_id, market, selection, event_id, odds_decimal, stake_units, leg_type, sport, created_at, game_date, graded_at, status")
    .eq("status", "pending")
    .not("event_id", "is", null)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(500);

  if (error) {
    console.error("[grading] fetch pending failed", error);
    throw new AppError({
      status: 503,
      code: "external_service_error",
      message: "Unable to load pending picks for grading.",
      details: { reason: "pending_picks_fetch_failed" },
      expose: true,
      cause: error,
    });
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
      gameData = await fetchBoxscore(eventId, String(picks[0]?.game_date ?? picks[0]?.created_at ?? '').slice(0, 10) || null);
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
          let atomicSettlementSucceeded = false;

          if (pick.leg_type === "parlay" && result.leg_results?.length) {
            const atomicSettlement = await settleParlayPacketAtomically(pick.id, result);

            if (atomicSettlement.ok) {
              atomicSettlementSucceeded = true;
            } else if (atomicSettlement.warning) {
              result.warnings = [...(result.warnings ?? []), atomicSettlement.warning];
            }
          }

          if (!atomicSettlementSucceeded) {
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
              const appliedLegGrades = await applyParlayLegGrades(pick.id, result.leg_results, result.game_date);
              const failedLegGrades = appliedLegGrades.filter((leg) => !leg.updated);
              if (failedLegGrades.length) {
                result.warnings = [
                  ...(result.warnings ?? []),
                  ...failedLegGrades.map(
                    (leg) => leg.warning ?? `Leg ${leg.leg_index} was not updated during grading.`
                  ),
                ];
              }
            }
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

async function resolveMlbGameFromSchedule(
  gamePk: string,
  expectedGameDate?: string | null
): Promise<{ status: any; game_date: string | null } | null> {
  if (!expectedGameDate) return null;

  const schedule = await sportsFetchJson<any>(`${MLB_API}/v1/schedule?sportId=1&date=${expectedGameDate}`, {
    cacheKey: `grading:schedule:${expectedGameDate}`,
    ttlMs: 10 * 60_000,
    timeoutMs: 10_000,
    retries: 1,
    debugLabel: "gradingService",
  });
  const games = (schedule?.dates ?? []).flatMap((date: any) => date?.games ?? []);
  const game = games.find((g: any) => String(g?.gamePk ?? g?.game_id ?? "") === String(gamePk));

  if (!game) {
    throw new Error(`game ${gamePk} not found on schedule date ${expectedGameDate}`);
  }

  return {
    status: game?.status || {},
    game_date:
      typeof game?.officialDate === "string"
        ? game.officialDate
        : typeof game?.gameDate === "string"
          ? String(game.gameDate).slice(0, 10)
          : expectedGameDate,
  };
}

/**
 * Fetch the boxscore for a game. Throws if the game is not yet final.
 * Uses schedule-by-date first when available so repaired legacy parlays grade against
 * the historical game date instead of only the live feed status.
 */
async function fetchBoxscore(gamePk: string, expectedGameDate?: string | null): Promise<FinalGameData> {
  let gameDate: string | null = null;

  const scheduledGame = await resolveMlbGameFromSchedule(gamePk, expectedGameDate);

  if (scheduledGame) {
    gameDate = scheduledGame.game_date;
    if (!isMlbFinalStatusText(scheduledGame.status)) {
      throw new Error(`game not final from schedule date ${expectedGameDate} (${formatMlbStatus(scheduledGame.status)})`);
    }
  } else {
    // Live feed fallback for rows without historical game_date.
    const feed = await sportsFetchJson<any>(`${MLB_API}/v1.1/game/${gamePk}/feed/live`, {
      cacheKey: `grading:feed:${gamePk}`,
      ttlMs: 2 * 60_000,
      timeoutMs: 10_000,
      retries: 1,
      debugLabel: "gradingService",
    });
    const status = feed?.gameData?.status || {};

    if (!isMlbFinalStatusText(status)) {
      throw new Error(`game not final (${formatMlbStatus(status)})`);
    }

    gameDate =
      typeof feed?.gameData?.datetime?.officialDate === "string"
        ? feed.gameData.datetime.officialDate
        : typeof feed?.gameData?.datetime?.originalDate === "string"
          ? feed.gameData.datetime.originalDate
          : null;
  }

  const boxscore = await sportsFetchJson<any>(`${MLB_API}/v1/game/${gamePk}/boxscore`, {
    cacheKey: `grading:boxscore:${gamePk}`,
    ttlMs: 10 * 60_000,
    timeoutMs: 10_000,
    retries: 1,
    debugLabel: "gradingService",
  });
  return { boxscore, game_date: gameDate ?? expectedGameDate ?? null };
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

  const { data: legs, error } = await supabaseAdmin
    .from("pick_legs")
    .select(
      "leg_index, market, selection, event_id, game_id, market_code, player_id, stat_target, comparator, event_key, odds_decimal"
    )
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

  const boxscoreCache = new Map<string, any>();
  const legResults: Array<{
    leg_index: number;
    status: "won" | "lost" | "push";
    odds: number;
    note?: string;
  }> = [];

  for (const leg of legs as any[]) {
    const rawGamePk = String(leg.game_id || leg.event_id || "").trim();

    if (!isLikelyMlbGamePk(rawGamePk)) {
      legResults.push({
        leg_index: Number(leg.leg_index),
        status: "push",
        odds: Number(leg.odds_decimal ?? 1),
        note: `Skipped legacy/manual leg with invalid game id: ${rawGamePk || "missing"}`,
      });
      continue;
    }

    let legBoxscore = boxscoreCache.get(rawGamePk);

    if (!legBoxscore) {
      try {
        if (rawGamePk === String((pick as any).event_id || "")) {
          legBoxscore = boxscore;
        } else {
          legBoxscore = await fetchBoxscore(rawGamePk, String(leg.game_date ?? (pick as any).game_date ?? '').slice(0, 10) || null);
        }
        boxscoreCache.set(rawGamePk, legBoxscore);
      } catch (err: any) {
        return {
          pick_id: pick.id,
          status: "graded_error",
          settled_units: null,
          error: `parlay_leg_event_not_ready:${rawGamePk}: ${err?.message || "boxscore unavailable"}`,
          warnings: [`Parlay leg ${leg.leg_index} game ${rawGamePk} is not ready/final yet.`],
        };
      }
    }

    const gradedLeg = await gradeParlayLegWithCache(supabaseAdmin, leg, legBoxscore);

    legResults.push({
      leg_index: Number(leg.leg_index),
      status: gradedLeg.status,
      odds: Number(leg.odds_decimal ?? 2.0),
      note: gradedLeg.note,
    });
  }

  const stake = Number(pick.stake_units ?? 1.0);

  if (legResults.length === 0) {
    return {
      pick_id: pick.id,
      status: "graded_error",
      settled_units: null,
      error: "parlay_no_gradable_legs",
    };
  }

  if (legResults.some((r) => r.status === "lost")) {
    return {
      pick_id: pick.id,
      status: "lost",
      settled_units: -Number(stake.toFixed(2)),
      learning_note: `Parlay lost: ${legResults.filter((r) => r.status === "lost").length} leg(s) lost.`,
      leg_results: legResults.map(({ leg_index, status, note }) => ({ leg_index, status, note })),
    };
  }

  const wonLegs = legResults.filter((r) => r.status === "won");
  const pushLegs = legResults.filter((r) => r.status === "push");

  if (wonLegs.length === 0) {
    return {
      pick_id: pick.id,
      status: "push",
      settled_units: 0.0,
      learning_note: `Parlay pushed/skipped: no losing legs and no winning legs were gradable.`,
      leg_results: legResults.map(({ leg_index, status, note }) => ({ leg_index, status, note })),
    };
  }

  const combinedOdds = wonLegs.reduce((product, leg) => product * Number(leg.odds || 1), 1);
  const payout = Number((stake * (combinedOdds - 1)).toFixed(2));

  return {
    pick_id: pick.id,
    status: "won",
    settled_units: payout,
    learning_note:
      pushLegs.length > 0
        ? `Parlay won with ${pushLegs.length} push/skipped leg(s). Effective ${wonLegs.length}-leg parlay at combined odds ${combinedOdds.toFixed(2)}.`
        : `Parlay won. ${wonLegs.length}-leg parlay at combined odds ${combinedOdds.toFixed(2)}.`,
    leg_results: legResults.map(({ leg_index, status, note }) => ({ leg_index, status, note })),
  };
}

async function gradeParlayLegWithCache(
  supabaseAdmin: any,
  leg: any,
  boxscore: any
): Promise<{ status: "won" | "lost" | "push"; note: string }> {
  const eventKey = String(leg.event_key || "").trim();

  if (eventKey) {
    const { data: cached, error: cacheReadError } = await supabaseAdmin
      .from("graded_leg_results")
      .select("status, note")
      .eq("event_key", eventKey)
      .maybeSingle();

    if (!cacheReadError && cached?.status) {
      return {
        status: cached.status as "won" | "lost" | "push",
        note: cached.note ? `Cached result: ${cached.note}` : "Cached graded leg result.",
      };
    }
  }

  const graded = gradeExactParlayLeg(leg, boxscore);

  if (eventKey) {
    const marketCode = normalizeMarketCode(leg.market_code || leg.market);
    const target = Number(leg.stat_target ?? defaultTargetForMarket(marketCode));
    const playerStats = findPlayerStatsForLeg(boxscore, leg);
    const actualValue = playerStats ? getActualStatForMarket(playerStats, marketCode) : null;

    const { error: cacheWriteError } = await supabaseAdmin
      .from("graded_leg_results")
      .upsert(
        {
          event_key: eventKey,
          sport: String(leg.sport || "mlb").toLowerCase(),
          game_id: leg.game_id || leg.event_id || null,
          player_id: leg.player_id || null,
          market_code: marketCode || null,
          stat_target: Number.isFinite(target) ? target : null,
          comparator: leg.comparator || ">=",
          actual_value: actualValue,
          status: graded.status,
          note: graded.note,
          source_provider: leg.external_provider || "mlb_statsapi",
          graded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "event_key" }
      );

    if (cacheWriteError) {
      console.warn("[grading] graded_leg_results upsert failed", cacheWriteError.code, cacheWriteError.message);
    }
  }

  return graded;
}

function gradeExactParlayLeg(
  leg: any,
  boxscore: any
): { status: "won" | "lost" | "push"; note: string } {
  const marketCode = normalizeMarketCode(leg.market_code || leg.market);
  const target = Number(leg.stat_target ?? defaultTargetForMarket(marketCode));
  const comparator = String(leg.comparator || ">=").trim();

  const playerStats = findPlayerStatsForLeg(boxscore, leg);

  if (!playerStats) {
    return {
      status: "push",
      note: `Could not match player for leg ${leg.leg_index} by player_id or selection fallback.`,
    };
  }

  const actual = getActualStatForMarket(playerStats, marketCode);

  if (actual === null) {
    return {
      status: "push",
      note: `Market ${marketCode || "UNKNOWN"} is not gradable from current boxscore stats.`,
    };
  }

  const won = compareStat(actual, target, comparator);

  return {
    status: won ? "won" : "lost",
    note: `${marketCode} graded ${actual} ${comparator} ${target} for ${playerStats.name || "matched player"}.`,
  };
}

function normalizeMarketCode(value: unknown): string {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

function defaultTargetForMarket(marketCode: string): number {
  if (marketCode === "HITS_2_PLUS") return 2;
  if (marketCode === "HITS_3_PLUS") return 3;
  return 1;
}

function compareStat(actual: number, target: number, comparator: string): boolean {
  if (comparator === ">" || comparator === "gt") return actual > target;
  if (comparator === "<" || comparator === "lt") return actual < target;
  if (comparator === "<=" || comparator === "lte") return actual <= target;
  if (comparator === "=" || comparator === "==" || comparator === "eq") return actual === target;
  return actual >= target;
}

function getActualStatForMarket(playerStats: any, marketCode: string): number | null {
  const batting = playerStats?.stats?.batting || playerStats?.batting || {};

  switch (marketCode) {
    case "HR":
    case "HOME_RUN":
    case "HOME_RUNS":
    case "ANYTIME_HR":
      return Number(batting.homeRuns ?? 0);

    case "HIT":
    case "HITS":
      return Number(batting.hits ?? 0);

    case "HITS_2_PLUS":
      return Number(batting.hits ?? 0);

    case "HITS_3_PLUS":
      return Number(batting.hits ?? 0);

    case "RBI":
    case "RBIS":
      return Number(batting.rbi ?? batting.rbis ?? 0);

    case "RUN":
    case "RUNS":
      return Number(batting.runs ?? 0);

    case "WALK":
    case "WALKS":
    case "BB":
      return Number(batting.baseOnBalls ?? batting.walks ?? 0);

    case "STOLEN_BASE":
    case "STOLEN_BASES":
    case "SB":
      return Number(batting.stolenBases ?? 0);

    case "TOTAL_BASES":
    case "TB":
      return Number(batting.totalBases ?? 0);

    case "SINGLE":
    case "SINGLES":
      return Number(batting.singles ?? Math.max(0, Number(batting.hits ?? 0) - Number(batting.doubles ?? 0) - Number(batting.triples ?? 0) - Number(batting.homeRuns ?? 0)));

    case "DOUBLE":
    case "DOUBLES":
      return Number(batting.doubles ?? 0);

    case "TRIPLE":
    case "TRIPLES":
      return Number(batting.triples ?? 0);

    default:
      return null;
  }
}

function findPlayerStatsForLeg(boxscore: any, leg: any): any | null {
  const teams = [boxscore?.teams?.away?.players, boxscore?.teams?.home?.players].filter(Boolean);

  if (leg.player_id) {
    const playerKey = `ID${leg.player_id}`;
    for (const players of teams) {
      if (players?.[playerKey]) {
        return players[playerKey];
      }
    }
  }

  const wantedName = extractPlayerName(String(leg.selection || ""), String(leg.market || ""));
  if (!wantedName) return null;

  for (const players of teams) {
    for (const player of Object.values(players || {}) as any[]) {
      const fullName = String(player?.person?.fullName || player?.name || "").toLowerCase();
      if (fullName && fullName.includes(wantedName.toLowerCase())) {
        return player;
      }
    }
  }

  return null;
}


type AtomicParlaySettlementResult = {
  ok: boolean;
  reason?: string;
  pick_id?: string;
  status?: string;
  updated_leg_count?: number;
  audit_id?: string;
};

async function settleParlayPacketAtomically(
  pickId: string,
  result: GradeResult
): Promise<{ ok: boolean; warning?: string; proof?: AtomicParlaySettlementResult }> {
  if (!result.leg_results?.length) {
    return { ok: false, warning: "No leg_results supplied for atomic parlay settlement." };
  }

  const supabaseAdmin = await getSupabaseAdmin();

  const p_leg_results = result.leg_results.map((leg) => ({
    leg_index: leg.leg_index,
    status: leg.status,
  }));

  const p_proof = {
    source: "gradingService.ts",
    settled_at: new Date().toISOString(),
    game_date: result.game_date ?? null,
    warnings: result.warnings ?? [],
  };

  const { data, error } = await supabaseAdmin.rpc("settle_parlay_packet", {
    p_pick_id: pickId,
    p_status: result.status,
    p_settled_units: result.settled_units ?? null,
    p_learning_note: result.learning_note ?? null,
    p_game_date: result.game_date ?? null,
    p_leg_results,
    p_proof,
  });

  if (error) {
    const missingRpc =
      error.code === "42883" ||
      error.code === "PGRST202" ||
      /settle_parlay_packet/i.test(error.message ?? "");

    return {
      ok: false,
      warning: missingRpc
        ? `Atomic settlement RPC is not available yet; falling back to legacy proof updates. ${error.message}`
        : `Atomic settlement RPC failed; falling back to legacy proof updates. ${error.message}`,
    };
  }

  const proof = data as AtomicParlaySettlementResult;

  if (!proof?.ok) {
    return {
      ok: false,
      warning: `Atomic settlement RPC declined settlement: ${proof?.reason ?? "unknown_reason"}`,
      proof,
    };
  }

  return { ok: true, proof };
}

type AppliedParlayLegGrade = {
  leg_index: number;
  status: string;
  updated: boolean;
  updatedRows: unknown[];
  warning?: string;
};

async function applyParlayLegGrades(
  pickId: string,
  legResults: NonNullable<GradeResult["leg_results"]>,
  gameDate?: string | null
): Promise<AppliedParlayLegGrade[]> {
  const supabaseAdmin = await getSupabaseAdmin();
  const gradedAt = new Date().toISOString();
  const applied: AppliedParlayLegGrade[] = [];

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
      .eq("status", "pending")
      .select("id,pick_id,leg_index,status,graded_at,game_date");

    if (result.error && ["42703", "PGRST204"].includes(result.error.code)) {
      result = await supabaseAdmin
        .from("pick_legs")
        .update(buildUpdate(false))
        .eq("pick_id", pickId)
        .eq("leg_index", leg.leg_index)
        .eq("status", "pending")
        .select("id,pick_id,leg_index,status,graded_at");
    }

    if (result.error) {
      const warning = `[grading] leg update failed pick=${pickId} leg=${leg.leg_index}: ${result.error.message}`;
      console.warn(warning);
      applied.push({
        leg_index: leg.leg_index,
        status: leg.status,
        updated: false,
        updatedRows: [],
        warning,
      });
      continue;
    }

    const updatedRows = result.data ?? [];
    if (updatedRows.length === 0) {
      const warning = `[grading] no pending leg updated pick=${pickId} leg=${leg.leg_index}`;
      console.warn(warning);
      applied.push({
        leg_index: leg.leg_index,
        status: leg.status,
        updated: false,
        updatedRows,
        warning,
      });
      continue;
    }

    applied.push({
      leg_index: leg.leg_index,
      status: leg.status,
      updated: true,
      updatedRows,
    });
  }

  return applied;
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
