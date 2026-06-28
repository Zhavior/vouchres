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

const MLB_API = process.env.MLB_API_BASE_URL ?? "https://statsapi.mlb.com/api";

export type LegStatus = "won" | "lost" | "push" | "pending" | "error";

export interface GradableLeg {
  sport: string; // 'mlb' | 'nba' | 'nfl'
  gamePk: string; // event id
  market: string; // 'hr' | 'hr_multi' | 'rbi' | 'rbi_over' | 'run' | 'hits' | 'tb'
  selection: string; // carries the player name, e.g. "Aaron Judge 1+ HR"
  threshold?: number;
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

/** Read a batting stat for a named player from an MLB boxscore. */
function countPlayerStat(raw: any, playerName: string, stat: string): number | null {
  if (!raw?.teams) return null;
  const nameLower = playerName.toLowerCase();
  for (const side of ["away", "home"]) {
    const players = raw.teams[side]?.players;
    if (!players) continue;
    for (const key of Object.keys(players)) {
      const p = players[key];
      const fullName = p?.person?.fullName?.toLowerCase();
      if (!fullName) continue;
      if (fullName === nameLower || fullName.endsWith(" " + nameLower)) {
        const v = p?.stats?.batting?.[stat];
        return typeof v === "number" ? v : 0;
      }
    }
  }
  return null; // player not found in this boxscore
}

/** Map a market code → the MLB boxscore stat field + default threshold. */
const MLB_MARKETS: Record<string, { stat: string; threshold: number }> = {
  hr: { stat: "homeRuns", threshold: 1 },
  hr_multi: { stat: "homeRuns", threshold: 2 },
  rbi: { stat: "rbi", threshold: 1 },
  rbi_over: { stat: "rbi", threshold: 1 }, // threshold overridden by leg.threshold
  run: { stat: "runs", threshold: 1 },
  runs: { stat: "runs", threshold: 1 },
  hits: { stat: "hits", threshold: 1 },
  hits_over: { stat: "hits", threshold: 1 },
  tb: { stat: "totalBases", threshold: 1 },
};

const mlbGrader: SportGrader = {
  sport: "mlb",
  supportedMarkets: Object.keys(MLB_MARKETS),

  async fetchGame(gamePk: string): Promise<GameData | null> {
    try {
      const res = await fetch(`${MLB_API}/v1/game/${gamePk}/boxscore`, {
        signal: AbortSignal.timeout(10_000),
        headers: { "User-Agent": "VouchEdge/1.0 (grading)" },
      });
      if (!res.ok) return null;
      const raw = await res.json();
      const state = raw?.info?.state ?? raw?.status?.state ?? "unknown";
      // Boxscore endpoint doesn't always carry a clean state; treat presence of
      // batting stats as a proxy when state is unknown.
      const looksFinal =
        state === "final" ||
        Boolean(raw?.teams?.home?.players && raw?.teams?.away?.players);
      return { final: looksFinal, raw };
    } catch {
      return null;
    }
  },

  evaluateLeg(leg: GradableLeg, game: GameData): LegOutcome {
    const def = MLB_MARKETS[leg.market.toLowerCase()];
    if (!def) return { status: "error", note: `unknown_market:${leg.market}` };

    const player = extractPlayerName(leg.selection);
    const actual = countPlayerStat(game.raw, player, def.stat);
    if (actual === null) {
      // Player not in boxscore — DNP / wrong game. Treat as push (refund).
      return { status: "push", actual: null, note: `player_not_found:${player}` };
    }
    const threshold = leg.threshold ?? def.threshold;
    return {
      status: actual >= threshold ? "won" : "lost",
      actual,
      note: `${player}: ${actual} ${def.stat} (need ${threshold}+)`,
    };
  },
};

/* ============================================================
   NBA / NFL — stubs (coming soon). Registering a real grader
   later is the only change needed to light them up.
   ============================================================ */

function comingSoonGrader(sport: string): SportGrader {
  return {
    sport,
    supportedMarkets: [],
    async fetchGame() {
      return null;
    },
    evaluateLeg() {
      return { status: "pending", note: `${sport}_grading_not_yet_supported` };
    },
  };
}

export const sportGraders: Record<string, SportGrader> = {
  mlb: mlbGrader,
  nba: comingSoonGrader("nba"),
  nfl: comingSoonGrader("nfl"),
};

export function getGrader(sport: string): SportGrader {
  return sportGraders[sport?.toLowerCase()] ?? comingSoonGrader(sport || "unknown");
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
