/**
 * Sport-keyed grader registry.
 *
 * The single place where "how do we settle a leg" lives, branched by sport.
 * MLB is fully implemented against the MLB Stats API boxscore. NBA/NFL are
 * stubbed (return 'pending') until their stat fetchers exist — adding them
 * later means implementing one SportGrader and registering it here.
 *
 * Used by BOTH grading paths:
 *   - the stateless POST /api/parlays/grade endpoint (no DB)
 *   - the production cron grader (gradingService) — delegates here so the
 *     persistent ledger is sport-aware too.
 */

import { sportsFetchJson } from "../../lib/sports/sportsHttpClient";
import { isMlbFinalStatusText } from "../mlb/gameStatus";
import { settleMlbPlayerMarket } from "./marketSettlementEngine";
import { isPlayerNameMatch } from "./gradingService";

const MLB_API = process.env.MLB_API_BASE_URL ?? "https://statsapi.mlb.com/api";

// Module-level cache: avoids redundant fetches across concurrent grade requests.
// Final games cached 10 min; non-final cached 2 min (will re-check soon).
const _gameStore = new Map<string, { data: GameData; expiresAt: number }>();
const _gameInFlight = new Map<string, Promise<GameData | null>>();

async function fetchMLBGameData(gamePk: string): Promise<GameData | null> {
  const cached = _gameStore.get(gamePk);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  let p = _gameInFlight.get(gamePk);
  if (!p) {
    p = _doFetchMLBGame(gamePk).then((data) => {
      if (data) {
        const ttl = data.final ? 10 * 60 * 1000 : 2 * 60 * 1000;
        _gameStore.set(gamePk, { data, expiresAt: Date.now() + ttl });
      }
      _gameInFlight.delete(gamePk);
      return data;
    });
    _gameInFlight.set(gamePk, p);
  }
  return p;
}

async function _doFetchMLBGame(gamePk: string): Promise<GameData | null> {
  try {
    const raw = await sportsFetchJson<any>(`${MLB_API}/v1/game/${gamePk}/boxscore`, {
      cacheKey: `grading:boxscore:${gamePk}`,
      ttlMs: 30_000,
      timeoutMs: 10_000,
      retries: 1,
      debugLabel: "sportGraders",
    });

    const feed = await sportsFetchJson<any>(`${MLB_API}/v1.1/game/${gamePk}/feed/live`, {
      cacheKey: `grading:feed:${gamePk}`,
      ttlMs: 30_000,
      timeoutMs: 10_000,
      retries: 1,
      debugLabel: "sportGraders",
    }).catch(() => null);

    const statusObj = feed?.gameData?.status || raw?.gameData?.status;
    const statusStr = statusObj?.detailedState || statusObj?.abstractGameState || "";
    const isFinal = isMlbFinalStatusText(statusStr) || isMlbFinalStatusText(statusObj);

    return { final: isFinal, raw: raw || feed?.liveData?.boxscore };
  } catch (err) {
    console.warn(
      `[sportGraders] MLB game fetch failed gamePk=${gamePk}:`,
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

export type LegStatus = "won" | "lost" | "push" | "pending" | "error";

export interface GradableLeg {
  sport: string; // 'mlb' | 'nba' | 'nfl'
  gamePk: string; // event id
  market: string; // 'hr' | 'hr_multi' | 'rbi' | 'rbi_over' | 'run' | 'hits' | 'tb'
  selection: string; // carries the player name, e.g. "Aaron Judge 1+ HR"
  playerId?: string | number;
  threshold?: number;
  comparator?: string;
  oddsDecimal?: number;
}

export interface LegOutcome {
  status: LegStatus;
  actual?: number | null; // observed stat value
  note?: string;
}

export interface GameData {
  final: boolean;
  raw: any;
}

export interface SportGrader {
  sport: string;
  supportedMarkets: string[];
  /** Returns game data, or null if the game can't be fetched yet. */
  fetchGame(gamePk: string): Promise<GameData | null>;
  evaluateLeg(leg: GradableLeg, game: GameData): LegOutcome;
}

/* ============================================================
   MLB grader — real implementation
   ============================================================ */

function extractPlayerName(selection: string): string {
  return selection
    // strip betting verbs / qualifiers
    .replace(/\b(anytime|to\s+hit|to\s+record|to\s+score|over|under)\b/gi, "")
    // strip "home run(s)" / "total bases" / "total hits" phrases
    .replace(/\b(home\s*runs?|total\s*bases?|total\s*hits?)\b/gi, "")
    // strip market abbreviations
    .replace(/\b(HR|RBI|RUNS?|HITS?|TB|BASES?)\b/gi, "")
    // strip thresholds like "2+", "1.5", "0.5"
    .replace(/\b\d+\.?\d*\s*\+?/g, "")
    // collapse leftover punctuation/space
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Map a market code → the MLB boxscore stat field + default threshold. */
const MLB_MARKETS = [
  "hr", "anytime_hr", "hr_multi", "rbi", "rbi_over", "run", "runs",
  "hit", "hits", "hits_over", "tb", "total_bases", "stolen_base",
  "stolen_bases", "strikeouts", "ks",
] as const;

const mlbGrader: SportGrader = {
  sport: "mlb",
  supportedMarkets: [...MLB_MARKETS],

  async fetchGame(gamePk: string): Promise<GameData | null> {
    return fetchMLBGameData(gamePk);
  },

  evaluateLeg(leg: GradableLeg, game: GameData): LegOutcome {
    if (!game.final) return { status: "pending", actual: null, note: "game not final" };
    const result = settleMlbPlayerMarket({
      sport: "mlb",
      marketCode: leg.market,
      playerId: leg.playerId,
      statTarget: leg.threshold,
      comparator: leg.comparator,
    }, game.raw);
    if (result.decision === "review") return { status: "error", actual: result.actual, note: result.reason };
    if (result.decision === "void") return { status: "push", actual: result.actual, note: result.reason };
    return { status: result.decision, actual: result.actual, note: result.reason };
  },
};

/* ============================================================
   ESPN Feed Helper (NBA / NFL)
   ============================================================ */

async function fetchEspnGameData(sport: "nba" | "nfl", gamePk: string): Promise<GameData | null> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/${sport === 'nba' ? 'basketball/nba' : 'football/nfl'}/summary?event=${gamePk}`;
  try {
    const raw = await sportsFetchJson<any>(url, {
      cacheKey: `grading:espn:${sport}:${gamePk}`,
      ttlMs: 30_000,
      timeoutMs: 10_000,
      retries: 1,
      debugLabel: `espnGrader:${sport}`,
    });

    const statusObj = raw?.header?.competitions?.[0]?.status;
    const isCompleted = Boolean(statusObj?.type?.completed || statusObj?.type?.state === "post");

    return { final: isCompleted, raw };
  } catch (err) {
    console.warn(`[sportGraders] ${sport.toUpperCase()} game fetch failed gamePk=${gamePk}:`, err instanceof Error ? err.message : String(err));
    return null;
  }
}

/* ============================================================
   NBA Grader
   ============================================================ */

function countNbaPlayerStat(raw: any, playerName: string, targetStat: string): number | null {
  const playerBlocks = raw?.boxscore?.players ?? [];
  for (const teamBlock of playerBlocks) {
    const statsList = teamBlock?.statistics ?? [];
    for (const statGroup of statsList) {
      const names: string[] = statGroup?.names ?? statGroup?.labels ?? [];
      const athletes = statGroup?.athletes ?? [];
      for (const entry of athletes) {
        const displayName = String(entry?.athlete?.displayName || entry?.athlete?.shortName || "");
        if (!displayName) continue;
        if (isPlayerNameMatch(displayName, playerName)) {
          const statsArr: string[] = entry?.stats ?? [];
          const idx = names.findIndex(n => n.toUpperCase() === targetStat.toUpperCase());
          if (idx !== -1 && statsArr[idx] !== undefined) {
            const rawVal = statsArr[idx];
            if (rawVal.includes("-")) {
              const made = Number(rawVal.split("-")[0]);
              return Number.isFinite(made) ? made : 0;
            }
            const num = Number(rawVal);
            return Number.isFinite(num) ? num : 0;
          }
        }
      }
    }
  }
  return null;
}

const NBA_MARKETS: Record<string, { stat: string; threshold: number }> = {
  pts: { stat: "PTS", threshold: 15 },
  points: { stat: "PTS", threshold: 15 },
  reb: { stat: "REB", threshold: 5 },
  rebounds: { stat: "REB", threshold: 5 },
  ast: { stat: "AST", threshold: 5 },
  assists: { stat: "AST", threshold: 5 },
  "3ptm": { stat: "3PM-A", threshold: 2 },
  threes: { stat: "3PM-A", threshold: 2 },
};

const nbaGrader: SportGrader = {
  sport: "nba",
  supportedMarkets: Object.keys(NBA_MARKETS),

  async fetchGame(gamePk: string): Promise<GameData | null> {
    return fetchEspnGameData("nba", gamePk);
  },

  evaluateLeg(leg: GradableLeg, game: GameData): LegOutcome {
    const marketKey = leg.market.toLowerCase();
    const def = NBA_MARKETS[marketKey];
    if (!def) return { status: "error", note: `unknown_market:${leg.market}` };

    const player = extractPlayerName(leg.selection);
    const actual = countNbaPlayerStat(game.raw, player, def.stat);
    if (actual === null) {
      if (game.final) {
        return { status: "push", actual: null, note: `player_not_found:${player}` };
      }
      return { status: "pending", actual: null, note: `game_in_progress:${player}` };
    }

    const threshold = leg.threshold ?? def.threshold;

    if (actual >= threshold) {
      return {
        status: "won",
        actual,
        note: `${player}: ${actual} ${def.stat} (needed ${threshold}+)`,
      };
    }

    if (game.final) {
      return {
        status: "lost",
        actual,
        note: `${player}: ${actual} ${def.stat} (needed ${threshold}+, Final)`,
      };
    }

    return {
      status: "pending",
      actual,
      note: `${player}: ${actual}/${threshold} ${def.stat} (In Progress)`,
    };
  },
};

/* ============================================================
   NFL Grader
   ============================================================ */

function countNflPlayerStat(raw: any, playerName: string, category: string, statName: string): number | null {
  const playerBlocks = raw?.boxscore?.players ?? [];
  for (const teamBlock of playerBlocks) {
    const statsList = teamBlock?.statistics ?? [];
    for (const statGroup of statsList) {
      if (category && String(statGroup?.name || "").toLowerCase() !== category.toLowerCase()) {
        continue;
      }
      const labels: string[] = statGroup?.labels ?? statGroup?.names ?? [];
      const athletes = statGroup?.athletes ?? [];
      for (const entry of athletes) {
        const displayName = String(entry?.athlete?.displayName || entry?.athlete?.shortName || "");
        if (!displayName) continue;
        if (isPlayerNameMatch(displayName, playerName)) {
          const statsArr: string[] = entry?.stats ?? [];
          const idx = labels.findIndex(l => l.toUpperCase() === statName.toUpperCase());
          if (idx !== -1 && statsArr[idx] !== undefined) {
            const num = Number(statsArr[idx]);
            return Number.isFinite(num) ? num : 0;
          }
        }
      }
    }
  }
  return null;
}

const NFL_MARKETS: Record<string, { category: string; stat: string; threshold: number }> = {
  pass_yds: { category: "passing", stat: "YDS", threshold: 200 },
  passing_yards: { category: "passing", stat: "YDS", threshold: 200 },
  rush_yds: { category: "rushing", stat: "YDS", threshold: 50 },
  rushing_yards: { category: "rushing", stat: "YDS", threshold: 50 },
  rec_yds: { category: "receiving", stat: "YDS", threshold: 50 },
  receiving_yards: { category: "receiving", stat: "YDS", threshold: 50 },
  td: { category: "", stat: "TD", threshold: 1 },
  touchdowns: { category: "", stat: "TD", threshold: 1 },
  rec: { category: "receiving", stat: "REC", threshold: 3 },
  receptions: { category: "receiving", stat: "REC", threshold: 3 },
};

const nflGrader: SportGrader = {
  sport: "nfl",
  supportedMarkets: Object.keys(NFL_MARKETS),

  async fetchGame(gamePk: string): Promise<GameData | null> {
    return fetchEspnGameData("nfl", gamePk);
  },

  evaluateLeg(leg: GradableLeg, game: GameData): LegOutcome {
    const marketKey = leg.market.toLowerCase();
    const def = NFL_MARKETS[marketKey];
    if (!def) return { status: "error", note: `unknown_market:${leg.market}` };

    const player = extractPlayerName(leg.selection);
    const actual = countNflPlayerStat(game.raw, player, def.category, def.stat);
    if (actual === null) {
      if (game.final) {
        return { status: "push", actual: null, note: `player_not_found:${player}` };
      }
      return { status: "pending", actual: null, note: `game_in_progress:${player}` };
    }

    const threshold = leg.threshold ?? def.threshold;

    if (actual >= threshold) {
      return {
        status: "won",
        actual,
        note: `${player}: ${actual} ${def.stat} (needed ${threshold}+)`,
      };
    }

    if (game.final) {
      return {
        status: "lost",
        actual,
        note: `${player}: ${actual} ${def.stat} (needed ${threshold}+, Final)`,
      };
    }

    return {
      status: "pending",
      actual,
      note: `${player}: ${actual}/${threshold} ${def.stat} (In Progress)`,
    };
  },
};

/**
 * Supported sports. Mirror of the client `SportId` (src/sports/registry.ts).
 */
export type SportId = "mlb" | "nba" | "nfl";

export const sportGraders: Record<SportId, SportGrader> = {
  mlb: mlbGrader,
  nba: nbaGrader,
  nfl: nflGrader,
};

export function getGrader(sport: string): SportGrader {
  return sportGraders[(sport?.toLowerCase() as SportId)] ?? mlbGrader;
}

/* ============================================================
   Parlay combine math — shared by both grading paths.
   ============================================================ */

export interface ParlaySettlement {
  status: LegStatus;
  settledUnits: number | null;
  combinedOdds: number | null;
  note: string;
}

/**
 * Combine per-leg outcomes into a parlay settlement using standard rules:
 *   - any leg pending → parlay pending (can't settle yet)
 *   - any leg lost    → parlay lost (−stake)
 *   - pushes drop out of the parlay (reduce effective size)
 *   - all remaining won → parlay won, payout = stake * (∏ wonOdds − 1)
 *   - all legs push     → refund (0)
 */
export function settleParlay(
  legs: Array<{ outcome: LegOutcome; oddsDecimal?: number }>,
  stakeUnits = 1.0
): ParlaySettlement {
  if (legs.some((l) => l.outcome.status === "pending")) {
    return { status: "pending", settledUnits: null, combinedOdds: null, note: "Awaiting final results." };
  }
  if (legs.some((l) => l.outcome.status === "error")) {
    return { status: "error", settledUnits: null, combinedOdds: null, note: "One or more legs could not be graded." };
  }
  if (legs.some((l) => l.outcome.status === "lost")) {
    const lost = legs.filter((l) => l.outcome.status === "lost").length;
    return { status: "lost", settledUnits: -Number(stakeUnits.toFixed(2)), combinedOdds: null, note: `${lost} leg(s) lost.` };
  }
  const won = legs.filter((l) => l.outcome.status === "won");
  const pushed = legs.filter((l) => l.outcome.status === "push");
  if (won.length === 0) {
    return { status: "push", settledUnits: 0, combinedOdds: null, note: `All ${pushed.length} leg(s) pushed — stake refunded.` };
  }
  const combinedOdds = won.reduce((p, l) => p * (l.oddsDecimal ?? 2.0), 1);
  const payout = Number((stakeUnits * (combinedOdds - 1)).toFixed(2));
  return {
    status: "won",
    settledUnits: payout,
    combinedOdds: Number(combinedOdds.toFixed(3)),
    note: pushed.length
      ? `Won with ${pushed.length} push(es) — effective ${won.length}-leg at ${combinedOdds.toFixed(2)}.`
      : `Won — ${won.length}-leg at ${combinedOdds.toFixed(2)}.`,
  };
}
