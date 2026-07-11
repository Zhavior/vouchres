import { toDecimalOrNull } from "../odds";

const MAX_SELECTION_LEN = 280;
const MAX_GAME_PK_LEN = 64;
const MAX_ODDS_DECIMAL = 10000;
const FAKE_GAME_PK_PREFIXES = ["leg-", "ai-leg-", "manual-"];

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
  game_id?: string | number | null;
  game?: string | number | null;
  eventId?: string | number | null;
  event_id?: string | number | null;
  eventKey?: string | null;
  event_key?: string | null;
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

function cleanIdentity(value: unknown): string | undefined {
  const text = String(value ?? "").trim();
  if (!text || text === "0" || text === "undefined" || text === "null") return undefined;
  if (text.toUpperCase().includes("TBD")) return undefined;
  return text;
}

export function isFakeGeneratedGamePk(value: unknown): boolean {
  const text = cleanIdentity(value);
  if (!text) return false;
  const lower = text.toLowerCase();
  return FAKE_GAME_PK_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

export function parseGamePkFromEventKey(eventKey: unknown): string | undefined {
  const text = cleanIdentity(eventKey);
  if (!text) return undefined;

  const parts = text.split("_").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return undefined;

  const sportPart = parts[0]?.toLowerCase();
  if (sportPart !== "mlb" && sportPart !== "nba" && sportPart !== "nfl") return undefined;

  const candidate = cleanIdentity(parts[1]);
  if (!candidate || isFakeGeneratedGamePk(candidate)) return undefined;
  if (/^\d{5,10}$/.test(candidate)) return candidate.slice(0, MAX_GAME_PK_LEN);

  return undefined;
}

/** Resolve the best available game identity for grading. */
export function resolveGradeGamePk(input: GradeLegPayloadInput): string | undefined {
  const gameField = cleanIdentity(input.game);
  const numericGame = gameField && /^\d{5,10}$/.test(gameField) ? gameField : undefined;
  const eventKeyGamePk =
    parseGamePkFromEventKey(input.eventKey)
    ?? parseGamePkFromEventKey(input.event_key);

  const candidates = [
    input.gamePk,
    input.gameId,
    input.game_pk,
    input.game_id,
    input.eventId,
    input.event_id,
    eventKeyGamePk,
    numericGame,
  ];

  for (const candidate of candidates) {
    const text = cleanIdentity(candidate);
    if (!text || isFakeGeneratedGamePk(text)) continue;
    return text.slice(0, MAX_GAME_PK_LEN);
  }

  return undefined;
}

export function buildGradeLegPayload(input: GradeLegPayloadInput): GradeLegPayload | null {
  const sport = normalizeSport(input.sport);
  const gamePk = resolveGradeGamePk(input);
  const marketCode = input.marketCode ?? input.market_code ?? input.market;
  const statTarget = input.statTarget ?? input.threshold ?? input.stat_target ?? undefined;
  const market = mapMarketCodeToGraderMarket(marketCode, statTarget).slice(0, 80);
  const selectionRaw =
    String(input.selection ?? "").trim() ||
    [input.playerName, input.marketLabel].filter(Boolean).join(" ").trim() ||
    "Player prop";
  const selection = selectionRaw.slice(0, MAX_SELECTION_LEN);

  if (!sport || !gamePk || !selection || !market) return null;

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
  if (oddsDecimal != null && oddsDecimal > 1 && oddsDecimal <= MAX_ODDS_DECIMAL) {
    payload.oddsDecimal = oddsDecimal;
  }
  return payload;
}
