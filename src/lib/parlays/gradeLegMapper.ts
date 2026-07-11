import { toDecimalOrNull } from "../odds";

/** Map canonical ParlayOS market codes to sport grader market keys. */
export function mapMarketCodeToGraderMarket(
  marketCode: unknown,
  statTarget?: number | null,
): string {
  const code = String(marketCode ?? "").trim().toUpperCase();
  const target = Number(statTarget ?? 1);

  if (code === "ANYTIME_HR" || code === "HR" || code === "HOME_RUN") {
    return target >= 2 ? "hr_multi" : "hr";
  }
  if (code === "HIT" || code.startsWith("HITS")) return "hits";
  if (code === "RBI") return "rbi";
  if (code === "RUN") return "run";
  if (code === "TOTAL_BASES" || code === "TB") return "tb";

  const raw = String(marketCode ?? "").trim().toLowerCase();
  if (raw === "anytime_hr" || raw === "home_run") return target >= 2 ? "hr_multi" : "hr";
  if (raw.includes("hr") || raw.includes("home_run")) return target >= 2 ? "hr_multi" : "hr";
  if (raw.includes("rbi")) return "rbi";
  if (raw.includes("run")) return "run";
  if (raw.includes("hit")) return "hits";
  if (raw.includes("total_bases") || raw === "tb") return "tb";

  return raw || "hr";
}

export type GradeLegPayloadInput = {
  sport?: string | null;
  gamePk?: string | number | null;
  gameId?: string | number | null;
  game_pk?: string | number | null;
  market?: string | null;
  marketCode?: string | null;
  market_code?: string | null;
  selection?: string | null;
  playerName?: string | null;
  marketLabel?: string | null;
  statTarget?: number | null;
  threshold?: number | null;
  stat_target?: number | null;
  odds?: number | null;
  oddsDecimal?: number | null;
};

export type GradeLegPayload = {
  sport: "mlb" | "nba" | "nfl";
  gamePk: string;
  market: string;
  selection: string;
  threshold?: number;
  oddsDecimal?: number;
};

function normalizeSport(raw: unknown): "mlb" | "nba" | "nfl" | null {
  const sport = String(raw ?? "mlb").trim().toLowerCase();
  if (sport === "mlb" || sport === "nba" || sport === "nfl") return sport;
  return null;
}

export function buildGradeLegPayload(input: GradeLegPayloadInput): GradeLegPayload | null {
  const sport = normalizeSport(input.sport);
  const gamePk = String(
    input.gamePk ?? input.gameId ?? input.game_pk ?? "",
  ).trim();
  const marketCode = input.marketCode ?? input.market_code ?? input.market;
  const statTarget = input.statTarget ?? input.threshold ?? input.stat_target ?? undefined;
  const market = mapMarketCodeToGraderMarket(marketCode, statTarget);
  const selection =
    String(input.selection ?? "").trim() ||
    [input.playerName, input.marketLabel].filter(Boolean).join(" ").trim() ||
    "Player prop";

  if (!sport || !gamePk || !selection) return null;

  const oddsDecimal = toDecimalOrNull(input.oddsDecimal ?? input.odds ?? null) ?? undefined;
  const threshold = statTarget != null && Number.isFinite(Number(statTarget))
    ? Number(statTarget)
    : undefined;

  const payload: GradeLegPayload = {
    sport,
    gamePk,
    market,
    selection,
  };
  if (threshold != null) payload.threshold = threshold;
  if (oddsDecimal != null && oddsDecimal > 1) payload.oddsDecimal = oddsDecimal;
  return payload;
}
