export type ParlaySport = "mlb" | "nba" | "nfl" | "nhl";

export type ParlaySource =
  | "hr_board"
  | "vai_smart_pick"
  | "player_research"
  | "team_matchup"
  | "manual_builder"
  | "posted_parlay"
  | "tailed_parlay"
  | "local_import";

export type ParlayMarketCode =
  | "ANYTIME_HR"
  | "HIT"
  | "RBI"
  | "RUN"
  | "TOTAL_BASES"
  | "STRIKEOUTS"
  | "PITCHER_OUTS"
  | "MONEYLINE"
  | "SPREAD"
  | "OVER_UNDER"
  | "UNKNOWN";

export type ParlayLegStatus =
  | "pending"
  | "live_hit"
  | "won"
  | "lost"
  | "void"
  | "cancelled";

export type ParlaySlipStatus =
  | "pending"
  | "live"
  | "won"
  | "lost"
  | "void"
  | "cancelled";

export interface CanonicalParlayLeg {
  id: string;
  sport: ParlaySport;
  source: ParlaySource;

  gamePk?: string;
  eventId?: string;
  gameLabel?: string;
  gameStartTime?: string;

  playerId?: string;
  playerName?: string;
  team?: string;
  opponent?: string;

  market: string;
  marketCode: ParlayMarketCode;
  selection: string;

  line?: number | null;
  odds?: number | string | null;
  requestedOdds?: number | string | null;
  verifiedOdds?: number | null;
  oddsSource?: string | null;
  oddsVerifiedAt?: string | null;

  status?: ParlayLegStatus;
  actual?: unknown;
  metadata?: Record<string, unknown>;
}

export interface CanonicalParlaySlip {
  id: string;
  clientRef: string;
  title: string;
  mode: "PRACTICE" | "REAL";
  source: ParlaySource;
  sport: ParlaySport;
  status: ParlaySlipStatus;
  wagerAmount: number;
  legs: CanonicalParlayLeg[];

  backendPickId?: string;
  originalPickId?: string;
  postedParlayId?: string;
  tailedFromUserId?: string;

  createdAt: string;
  metadata?: Record<string, unknown>;
}

const MARKET_ALIASES: Record<string, ParlayMarketCode> = {
  anytime_hr: "ANYTIME_HR",
  anytimehomerun: "ANYTIME_HR",
  "anytime hr": "ANYTIME_HR",
  "anytime home run": "ANYTIME_HR",
  homerun: "ANYTIME_HR",
  "home run": "ANYTIME_HR",
  hr: "ANYTIME_HR",
  hit: "HIT",
  hits: "HIT",
  rbi: "RBI",
  run: "RUN",
  runs: "RUN",
  total_bases: "TOTAL_BASES",
  "total bases": "TOTAL_BASES",
  strikeouts: "STRIKEOUTS",
  "pitcher strikeouts": "STRIKEOUTS",
  pitcher_outs: "PITCHER_OUTS",
  "pitcher outs": "PITCHER_OUTS",
  moneyline: "MONEYLINE",
  spread: "SPREAD",
  over_under: "OVER_UNDER",
  "over/under": "OVER_UNDER",
};

function cleanString(value: unknown): string | undefined {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeMarketCode(value: unknown): ParlayMarketCode {
  const raw = String(value ?? "").trim();
  if (!raw) return "UNKNOWN";

  const upper = raw.toUpperCase();
  if (
    [
      "ANYTIME_HR",
      "HIT",
      "RBI",
      "RUN",
      "TOTAL_BASES",
      "STRIKEOUTS",
      "PITCHER_OUTS",
      "MONEYLINE",
      "SPREAD",
      "OVER_UNDER",
    ].includes(upper)
  ) {
    return upper as ParlayMarketCode;
  }

  return MARKET_ALIASES[raw.toLowerCase()] ?? "UNKNOWN";
}

export function normalizeParlayLeg(input: any, source: ParlaySource = "manual_builder"): CanonicalParlayLeg {
  const market = cleanString(input?.market || input?.marketName || input?.marketCode) || "Unknown Market";
  const marketCode = normalizeMarketCode(input?.marketCode || input?.market || input?.marketName);

  return {
    id: cleanString(input?.id) || makeId("leg"),
    sport: (cleanString(input?.sport)?.toLowerCase() as ParlaySport) || "mlb",
    source,

    gamePk: cleanString(input?.gamePk || input?.event_id || input?.eventId),
    eventId: cleanString(input?.eventId || input?.event_id || input?.gamePk),
    gameLabel: cleanString(input?.game || input?.gameLabel),
    gameStartTime: cleanString(input?.gameStartTime),

    playerId: cleanString(input?.playerId || input?.player_id),
    playerName: cleanString(input?.playerName || input?.player || input?.selection),
    team: cleanString(input?.team),
    opponent: cleanString(input?.opponent),

    market,
    marketCode,
    selection: cleanString(input?.selection || input?.spec || input?.playerName || input?.player) || market,

    line: typeof input?.line === "number" ? input.line : input?.line ? Number(input.line) : null,
    odds: input?.odds ?? input?.oddsDisplay ?? null,
    requestedOdds: input?.odds ?? input?.oddsDisplay ?? null,
    verifiedOdds: typeof input?.verifiedOdds === "number" ? input.verifiedOdds : null,
    oddsSource: cleanString(input?.oddsSource),
    oddsVerifiedAt: cleanString(input?.oddsVerifiedAt),

    status: (cleanString(input?.status) as ParlayLegStatus) || "pending",
    actual: input?.actual ?? null,
    metadata: {
      rawSource: source,
      headshot: input?.headshot,
      original: input,
    },
  };
}

export function normalizeParlaySlip(input: any, source: ParlaySource = "manual_builder"): CanonicalParlaySlip {
  const legs = Array.isArray(input?.legs)
    ? input.legs.map((leg: any) => normalizeParlayLeg(leg, source))
    : [];

  const id = cleanString(input?.id) || makeId("slip");

  return {
    id,
    clientRef: cleanString(input?.clientRef) || id,
    title: cleanString(input?.title) || `${legs.length || 0}-Leg Parlay`,
    mode: input?.mode === "REAL" ? "REAL" : "PRACTICE",
    source,
    sport: (cleanString(input?.sport)?.toLowerCase() as ParlaySport) || "mlb",
    status: (cleanString(input?.status) as ParlaySlipStatus) || "pending",
    wagerAmount: Number(input?.wagerAmount || input?.wager || 1),
    legs,

    backendPickId: cleanString(input?.backendPickId),
    originalPickId: cleanString(input?.originalPickId),
    postedParlayId: cleanString(input?.postedParlayId),
    tailedFromUserId: cleanString(input?.tailedFromUserId),

    createdAt: cleanString(input?.createdAt) || new Date().toISOString(),
    metadata: {
      rawSource: source,
      totalOdds: input?.totalOdds,
      oddsValue: input?.oddsValue,
      riskTier: input?.riskTier,
      aiGenerated: input?.aiGenerated,
      original: input,
    },
  };
}

export function isImportableLiveLeg(leg: CanonicalParlayLeg): boolean {
  return Boolean(leg.gamePk && leg.playerId && leg.marketCode !== "UNKNOWN");
}

export function buildSaveParlayPayload(slip: CanonicalParlaySlip) {
  return {
    id: slip.id,
    clientRef: slip.clientRef,
    title: slip.title,
    mode: slip.mode,
    status: slip.status,
    wagerAmount: slip.wagerAmount,
    aiGenerated: slip.metadata?.aiGenerated === true,
    source: slip.source,
    sport: slip.sport,
    legs: slip.legs.map((leg) => ({
      id: leg.id,
      sport: leg.sport,
      game: leg.gameLabel,
      market: leg.market,
      marketCode: leg.marketCode,
      selection: leg.selection,
      line: leg.line ?? null,
      odds: leg.odds,
      requestedOdds: leg.requestedOdds,
      status: leg.status || "pending",
      gamePk: leg.gamePk,
      eventId: leg.eventId || leg.gamePk,
      playerId: leg.playerId,
      playerName: leg.playerName,
      actual: leg.actual ?? null,
      metadata: leg.metadata,
    })),
  };
}

export function normalizeLocalSlip(input: any): CanonicalParlaySlip {
  return normalizeParlaySlip(input, "local_import");
}
