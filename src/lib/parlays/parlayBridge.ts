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
  | "WALK"
  | "STOLEN_BASE"
  | "SINGLE"
  | "DOUBLE"
  | "TRIPLE"
  | "HBP"
  | "SAC_FLY"
  | "GIDP"
  | "CAUGHT_STEALING"
  | "POINTS"
  | "REBOUNDS"
  | "ASSISTS"
  | "THREES"
  | "TOUCHDOWN"
  | "PASSING_YARDS"
  | "RUSHING_YARDS"
  | "RECEIVING_YARDS"
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
  walk: "WALK",
  walks: "WALK",
  bb: "WALK",
  stolenbase: "STOLEN_BASE",
  "stolen base": "STOLEN_BASE",
  stolen_bases: "STOLEN_BASE",
  sb: "STOLEN_BASE",
  single: "SINGLE",
  double: "DOUBLE",
  doubles: "DOUBLE",
  triple: "TRIPLE",
  triples: "TRIPLE",
  hbp: "HBP",
  "hit by pitch": "HBP",
  sac_fly: "SAC_FLY",
  "sac fly": "SAC_FLY",
  gidp: "GIDP",
  caught_stealing: "CAUGHT_STEALING",
  "caught stealing": "CAUGHT_STEALING",
  cs: "CAUGHT_STEALING",
  points: "POINTS",
  rebounds: "REBOUNDS",
  assists: "ASSISTS",
  threes: "THREES",
  touchdown: "TOUCHDOWN",
  passing_yards: "PASSING_YARDS",
  rushing_yards: "RUSHING_YARDS",
  receiving_yards: "RECEIVING_YARDS",
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

function cleanId(value: unknown): string | undefined {
  const text = cleanString(value);
  if (!text || text === "undefined" || text === "null") return undefined;
  return text;
}

function safeKeyPart(value: unknown): string | undefined {
  const text = cleanId(value);
  if (!text) return undefined;
  return text.replace(/[^a-zA-Z0-9_-]/g, "").toUpperCase();
}

function normalizeGameId(input: any): string | undefined {
  return cleanId(input?.gameId) || cleanId(input?.game_id) || cleanId(input?.gamePk) || cleanId(input?.game_pk) || cleanId(input?.eventId) || cleanId(input?.event_id);
}

function normalizeTeamId(input: any): string | undefined {
  return cleanId(input?.teamId) || cleanId(input?.team_id) || cleanId(input?.team?.id) || cleanId(input?.team?.teamId) || cleanId(input?.teamCode) || cleanId(input?.teamAbbr) || cleanId(input?.team);
}

function normalizePlayerId(input: any): string | undefined {
  return cleanId(input?.playerId) || cleanId(input?.player_id) || cleanId(input?.personId) || cleanId(input?.person_id) || cleanId(input?.player?.id) || cleanId(input?.player?.playerId);
}

function buildEventKey(parts: {
  sport?: unknown;
  gameId?: unknown;
  teamId?: unknown;
  playerId?: unknown;
  marketCode?: unknown;
}): string | undefined {
  const sport = safeKeyPart(parts.sport) || "MLB";
  const gameId = safeKeyPart(parts.gameId);
  const teamId = safeKeyPart(parts.teamId) || "TEAM";
  const playerId = safeKeyPart(parts.playerId);
  const marketCode = safeKeyPart(parts.marketCode);

  if (!gameId || !playerId || !marketCode || marketCode === "UNKNOWN") return undefined;
  return [sport, gameId, teamId, playerId, marketCode].join("_");
}

function buildPopularityKey(parts: {
  sport?: unknown;
  playerId?: unknown;
  marketCode?: unknown;
}): string | undefined {
  const sport = safeKeyPart(parts.sport) || "MLB";
  const playerId = safeKeyPart(parts.playerId);
  const marketCode = safeKeyPart(parts.marketCode);

  if (!playerId || !marketCode || marketCode === "UNKNOWN") return undefined;
  return [sport, playerId, marketCode].join("_");
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
      "WALK",
      "STOLEN_BASE",
      "SINGLE",
      "DOUBLE",
      "TRIPLE",
      "HBP",
      "SAC_FLY",
      "GIDP",
      "CAUGHT_STEALING",
      "POINTS",
      "REBOUNDS",
      "ASSISTS",
      "THREES",
      "TOUCHDOWN",
      "PASSING_YARDS",
      "RUSHING_YARDS",
      "RECEIVING_YARDS",
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
  const market = cleanString(input?.market || input?.marketName || input?.marketCode || input?.market_code) || "Unknown Market";
  const marketCode = normalizeMarketCode(input?.marketCode || input?.market_code || input?.market || input?.marketName);
  const sport = (cleanString(input?.sport)?.toLowerCase() as ParlaySport) || "mlb";
  const gameId = normalizeGameId(input);
  const teamId = normalizeTeamId(input);
  const playerId = normalizePlayerId(input);
  const eventKey = cleanString(input?.eventKey || input?.event_key) || buildEventKey({ sport, gameId, teamId, playerId, marketCode });
  const popularityKey = cleanString(input?.popularityKey || input?.popularity_key) || buildPopularityKey({ sport, playerId, marketCode });

  return {
    id: cleanString(input?.id) || makeId("leg"),
    sport,
    source,

    gamePk: cleanString(input?.gamePk || input?.game_pk || gameId),
    gameId,
    eventId: cleanString(input?.eventId || input?.event_id || gameId),
    gameLabel: cleanString(input?.game || input?.gameLabel),
    gameStartTime: cleanString(input?.gameStartTime),

    teamId,
    playerId,
    playerName: cleanString(input?.playerName || input?.player || input?.selection || input?.player_name),
    eventKey,
    popularityKey,
    statTarget: input?.statTarget ?? input?.stat_target ?? input?.target ?? input?.line ?? null,
    comparator: cleanString(input?.comparator || input?.operator || input?.direction),
    externalProvider: cleanString(input?.externalProvider || input?.external_provider || input?.provider),
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
      gameId: leg.gameId || leg.gamePk || leg.eventId,
      eventId: leg.eventId || leg.gamePk || leg.gameId,
      teamId: leg.teamId,
      playerId: leg.playerId,
      playerName: leg.playerName,
      eventKey: leg.eventKey,
      popularityKey: leg.popularityKey,
      statTarget: leg.statTarget ?? null,
      comparator: leg.comparator,
      externalProvider: leg.externalProvider,
      actual: leg.actual ?? null,
      metadata: leg.metadata,
    })),
  };
}

export function normalizeLocalSlip(input: any): CanonicalParlaySlip {
  return normalizeParlaySlip(input, "local_import");
}
