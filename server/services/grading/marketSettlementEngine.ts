export type SettlementDecision = "won" | "lost" | "push" | "void" | "review";

export interface MarketSettlementInput {
  sport: string;
  marketCode: string;
  playerId?: string | number | null;
  statTarget?: string | number | null;
  comparator?: string | null;
  legIndex?: number | null;
}

export interface MarketSettlementResult {
  decision: SettlementDecision;
  actual: number | null;
  target: number | null;
  comparator: ">" | ">=" | "<" | "<=" | "=" | null;
  reason: string;
  playerName?: string;
}

type MlbMarketContract = {
  statGroup: "batting" | "pitching";
  statFields: string[];
  defaultTarget: number;
};

const MLB_MARKETS: Record<string, MlbMarketContract> = {
  HR: { statGroup: "batting", statFields: ["homeRuns"], defaultTarget: 1 },
  HOME_RUN: { statGroup: "batting", statFields: ["homeRuns"], defaultTarget: 1 },
  HOME_RUNS: { statGroup: "batting", statFields: ["homeRuns"], defaultTarget: 1 },
  ANYTIME_HR: { statGroup: "batting", statFields: ["homeRuns"], defaultTarget: 1 },
  HR_MULTI: { statGroup: "batting", statFields: ["homeRuns"], defaultTarget: 2 },
  HIT: { statGroup: "batting", statFields: ["hits"], defaultTarget: 1 },
  HITS: { statGroup: "batting", statFields: ["hits"], defaultTarget: 1 },
  HITS_2_PLUS: { statGroup: "batting", statFields: ["hits"], defaultTarget: 2 },
  HITS_3_PLUS: { statGroup: "batting", statFields: ["hits"], defaultTarget: 3 },
  HITS_OVER: { statGroup: "batting", statFields: ["hits"], defaultTarget: 1 },
  RBI: { statGroup: "batting", statFields: ["rbi", "rbis"], defaultTarget: 1 },
  RBIS: { statGroup: "batting", statFields: ["rbi", "rbis"], defaultTarget: 1 },
  RBI_OVER: { statGroup: "batting", statFields: ["rbi", "rbis"], defaultTarget: 1 },
  RUN: { statGroup: "batting", statFields: ["runs"], defaultTarget: 1 },
  RUNS: { statGroup: "batting", statFields: ["runs"], defaultTarget: 1 },
  WALK: { statGroup: "batting", statFields: ["baseOnBalls", "walks"], defaultTarget: 1 },
  WALKS: { statGroup: "batting", statFields: ["baseOnBalls", "walks"], defaultTarget: 1 },
  BB: { statGroup: "batting", statFields: ["baseOnBalls", "walks"], defaultTarget: 1 },
  STOLEN_BASE: { statGroup: "batting", statFields: ["stolenBases"], defaultTarget: 1 },
  STOLEN_BASES: { statGroup: "batting", statFields: ["stolenBases"], defaultTarget: 1 },
  SB: { statGroup: "batting", statFields: ["stolenBases"], defaultTarget: 1 },
  TOTAL_BASES: { statGroup: "batting", statFields: ["totalBases"], defaultTarget: 1 },
  TB: { statGroup: "batting", statFields: ["totalBases"], defaultTarget: 1 },
  SINGLE: { statGroup: "batting", statFields: ["singles"], defaultTarget: 1 },
  SINGLES: { statGroup: "batting", statFields: ["singles"], defaultTarget: 1 },
  DOUBLE: { statGroup: "batting", statFields: ["doubles"], defaultTarget: 1 },
  DOUBLES: { statGroup: "batting", statFields: ["doubles"], defaultTarget: 1 },
  TRIPLE: { statGroup: "batting", statFields: ["triples"], defaultTarget: 1 },
  TRIPLES: { statGroup: "batting", statFields: ["triples"], defaultTarget: 1 },
  PITCHER_STRIKEOUTS: { statGroup: "pitching", statFields: ["strikeOuts", "strikeouts"], defaultTarget: 5 },
  STRIKEOUTS: { statGroup: "pitching", statFields: ["strikeOuts", "strikeouts"], defaultTarget: 5 },
  KS: { statGroup: "pitching", statFields: ["strikeOuts", "strikeouts"], defaultTarget: 5 },
};

export function normalizeSettlementMarketCode(value: unknown): string {
  return String(value ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");
}

function normalizeComparator(value: unknown): MarketSettlementResult["comparator"] {
  const key = String(value ?? ">=").trim().toLowerCase();
  if (key === ">" || key === "gt") return ">";
  if (key === ">=" || key === "gte") return ">=";
  if (key === "<" || key === "lt") return "<";
  if (key === "<=" || key === "lte") return "<=";
  if (key === "=" || key === "==" || key === "eq") return "=";
  return null;
}

function compare(actual: number, target: number, comparator: NonNullable<MarketSettlementResult["comparator"]>): boolean {
  if (comparator === ">") return actual > target;
  if (comparator === "<") return actual < target;
  if (comparator === "<=") return actual <= target;
  if (comparator === "=") return actual === target;
  return actual >= target;
}

function findPlayerById(boxscore: any, playerId: string): any | null {
  const key = `ID${playerId}`;
  for (const side of ["away", "home"] as const) {
    const player = boxscore?.teams?.[side]?.players?.[key];
    if (player) return player;
  }
  return null;
}

function readFiniteStat(stats: Record<string, unknown>, fields: string[]): number | null {
  for (const field of fields) {
    if (stats[field] === undefined || stats[field] === null) continue;
    const value = Number(stats[field]);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function hasParticipated(player: any, group: "batting" | "pitching"): boolean {
  const stats = player?.stats?.[group];
  if (!stats || typeof stats !== "object") return false;
  if (group === "batting") {
    return Number(stats.plateAppearances ?? stats.atBats ?? 0) > 0;
  }
  const innings = Number.parseFloat(String(stats.inningsPitched ?? "0"));
  return Number.isFinite(innings) && innings > 0;
}

/**
 * Deterministic MLB settlement. It deliberately has no name fallback: a display
 * string is not durable enough to move a user's result ledger.
 */
export function settleMlbPlayerMarket(
  input: MarketSettlementInput,
  boxscore: any,
): MarketSettlementResult {
  const marketCode = normalizeSettlementMarketCode(input.marketCode);
  const contract = MLB_MARKETS[marketCode];
  const prefix = input.legIndex == null ? "Leg" : `Leg ${input.legIndex}`;

  if (String(input.sport || "mlb").toLowerCase() !== "mlb") {
    return { decision: "review", actual: null, target: null, comparator: null, reason: `${prefix}: unsupported sport.` };
  }
  if (!contract) {
    return { decision: "review", actual: null, target: null, comparator: null, reason: `${prefix}: unsupported market ${marketCode || "UNKNOWN"}.` };
  }

  const playerId = String(input.playerId ?? "").trim();
  if (!/^\d+$/.test(playerId)) {
    return { decision: "review", actual: null, target: null, comparator: null, reason: `${prefix}: canonical player_id is required.` };
  }

  const comparator = normalizeComparator(input.comparator);
  const target = input.statTarget == null || input.statTarget === ""
    ? contract.defaultTarget
    : Number(input.statTarget);
  if (!comparator || !Number.isFinite(target) || target < 0) {
    return { decision: "review", actual: null, target: Number.isFinite(target) ? target : null, comparator, reason: `${prefix}: invalid frozen line or comparator.` };
  }

  const player = findPlayerById(boxscore, playerId);
  if (!player) {
    return { decision: "review", actual: null, target, comparator, reason: `${prefix}: player_id ${playerId} is absent from the official box score.` };
  }

  const playerName = String(player?.person?.fullName ?? player?.name ?? playerId);
  if (!hasParticipated(player, contract.statGroup)) {
    return { decision: "void", actual: null, target, comparator, playerName, reason: `${playerName} did not participate; leg voided.` };
  }

  const statGroup = player?.stats?.[contract.statGroup] ?? {};
  let actual = readFiniteStat(statGroup, contract.statFields);
  if (actual === null && (marketCode === "SINGLE" || marketCode === "SINGLES")) {
    const hits = readFiniteStat(statGroup, ["hits"]);
    const doubles = readFiniteStat(statGroup, ["doubles"]);
    const triples = readFiniteStat(statGroup, ["triples"]);
    const homeRuns = readFiniteStat(statGroup, ["homeRuns"]);
    if ([hits, doubles, triples, homeRuns].every((value) => value !== null)) {
      actual = Math.max(0, Number(hits) - Number(doubles) - Number(triples) - Number(homeRuns));
    }
  }
  if (actual === null) {
    return { decision: "review", actual: null, target, comparator, playerName, reason: `${prefix}: official ${contract.statGroup} statistic is unavailable.` };
  }

  const won = compare(actual, target, comparator);
  return {
    decision: won ? "won" : "lost",
    actual,
    target,
    comparator,
    playerName,
    reason: `${playerName}: ${marketCode} ${actual} ${comparator} ${target}.`,
  };
}
