import { getSupabaseAdmin } from "../../middleware/auth";
import { gradePick } from "../persistence/pickService";

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
} = {}): Promise<{ graded: GradeResult[]; skipped: GradeResult[] }> {
  const supabaseAdmin = await getSupabaseAdmin();
  const days = opts.days ?? 3;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // 1. Fetch pending picks
  const { data: pending, error } = await supabaseAdmin
    .from("picks")
    .select("id, market, selection, event_id, odds_decimal, stake_units, leg_type, sport, created_at")
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
    return { graded: [], skipped: [] };
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
    let boxscore: any;
    try {
      boxscore = await fetchBoxscore(eventId);
    } catch (err: any) {
      // Game not final yet, or fetch failed — skip all picks for this event
      console.log(`[grading] skipping event ${eventId}: ${err.message}`);
      for (const pick of picks) {
        skipped.push({
          pick_id: pick.id,
          status: "graded_error",
          settled_units: null,
          error: err.message,
        });
      }
      continue;
    }

    // 4. Evaluate each pick
    for (const pick of picks) {
      try {
        const result = await evaluatePick(pick, boxscore);

        if (result.status === "graded_error") {
          skipped.push({ ...result, pick_id: pick.id });
          continue;
        }

        if (!opts.dryRun) {
          await gradePick({
            pickId: pick.id,
            status: result.status,
            settledUnits: result.settled_units,
            learningNote: result.learning_note,
          });
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

  return { graded, skipped };
}

/**
 * Fetch the boxscore for a game. Throws if the game is not yet final.
 */
async function fetchBoxscore(gamePk: string): Promise<any> {
  const url = `${MLB_API}/v1/game/${gamePk}/boxscore`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(10_000),
    headers: { "User-Agent": "VouchEdge/1.0 (grading service)" },
  });

  if (!res.ok) {
    throw new Error(`boxscore fetch ${res.status}`);
  }

  const data = await res.json();

  // Verify game is final
  const gameState = data?.info?.state ?? data?.status?.state ?? "unknown";
  if (gameState !== "final") {
    throw new Error(`game not final (state=${gameState})`);
  }

  return data;
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

  if (market === "parlay") {
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
  },
  boxscore: any
): Promise<GradeResult> {
  const supabaseAdmin = await getSupabaseAdmin();
  // 1. Load legs
  const { data: legs, error } = await supabaseAdmin
    .from("pick_legs")
    .select("leg_index, market, selection, event_id, odds_decimal")
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
  const legResults: Array<{ status: "won" | "lost" | "push"; odds: number }> = [];

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
      status: legResult.status as "won" | "lost" | "push",
      odds: leg.odds_decimal ?? 2.0,
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
