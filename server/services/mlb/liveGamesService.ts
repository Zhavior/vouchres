import { getScheduleByDate, todayISO } from "./mlbClient";
import { isMlbFinalStatusText, isMlbLiveStatus } from "./gameStatus";
import { MlbScheduleGame, parseMlbScheduleResponse } from "./mlbStatsApiSchemas";
import { buildApiMeta, type ApiResponseMeta } from "../../lib/apiResponseMeta";
import type { NormalizedGame } from "./mlbTypes";

type NullableSidePct = { home: number | null; away: number | null };

export interface LiveGamePredictionBlock {
  winningPct: NullableSidePct;
  hrPct: NullableSidePct;
  hitsPct: NullableSidePct;
  rbisPct: NullableSidePct;
}

export interface LiveGameCard {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  venue: string | null;
  gameDate: string | null;
  isLive: boolean;
  isFinal: boolean;
  isApiReal: boolean;
  predictionsAvailable: false;
  predictionStatus: "unavailable";
  predictionSource: "not_computed";
  predictions: LiveGamePredictionBlock;
}

export interface LiveGamesResponse {
  success: true;
  isRealApi: boolean;
  dataQuality: "official_mlb_schedule" | "official_mlb_empty_schedule";
  source: "mlb_statsapi_schedule";
  date: string;
  games: LiveGameCard[];
  warnings: string[];
  updatedAt: string;
  meta: ApiResponseMeta;
}

const EMPTY_PREDICTIONS: LiveGamePredictionBlock = {
  winningPct: { home: null, away: null },
  hrPct: { home: null, away: null },
  hitsPct: { home: null, away: null },
  rbisPct: { home: null, away: null },
};

function safeName(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeScore(value: unknown): number | null {
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function normalizeLiveGame(game: MlbScheduleGame): LiveGameCard {
  const status = game.status?.detailedState ?? game.status?.abstractGameState;

  return {
    id: String(game.gamePk),
    homeTeam: safeName(game.teams?.home?.team?.name, "Home Team"),
    awayTeam: safeName(game.teams?.away?.team?.name, "Away Team"),
    homeScore: safeScore(game.teams?.home?.score),
    awayScore: safeScore(game.teams?.away?.score),
    status: safeName(status, "Scheduled"),
    venue: typeof game.venue?.name === "string" && game.venue.name.trim() ? game.venue.name.trim() : null,
    gameDate: typeof game.gameDate === "string" ? game.gameDate : null,
    isLive: isMlbLiveStatus(status),
    isFinal: isMlbFinalStatusText(status),
    isApiReal: true,
    predictionsAvailable: false,
    predictionStatus: "unavailable",
    predictionSource: "not_computed",
    predictions: EMPTY_PREDICTIONS,
  };
}

function normalizeScheduleGame(game: NormalizedGame): LiveGameCard {
  return {
    id: String(game.gamePk),
    homeTeam: safeName(game.homeTeam.name, "Home Team"),
    awayTeam: safeName(game.awayTeam.name, "Away Team"),
    homeScore: safeScore(game.score.home),
    awayScore: safeScore(game.score.away),
    status: safeName(game.status, "Scheduled"),
    venue: game.venue && game.venue !== "TBD" ? game.venue : null,
    gameDate: game.gameDate || null,
    isLive: isMlbLiveStatus(game.status),
    isFinal: isMlbFinalStatusText(game.status),
    isApiReal: true,
    predictionsAvailable: false,
    predictionStatus: "unavailable",
    predictionSource: "not_computed",
    predictions: EMPTY_PREDICTIONS,
  };
}

export function buildLiveGamesResponse(scheduleData: unknown, date: string, now = new Date()): LiveGamesResponse {
  const { games, warnings: parseWarnings } = parseMlbScheduleResponse(scheduleData, `live:${date}`);
  const normalizedGames = games.map(normalizeLiveGame).filter((game) => game.id);

  const warnings = [
    ...parseWarnings,
    ...(normalizedGames.length > 0
      ? ["Probability fields are unavailable until a backed model is connected; no synthetic projections returned."]
      : ["Official MLB schedule returned no games for this date; no mock games were substituted."]),
  ];
  const updatedAt = now.toISOString();

  return {
    success: true,
    isRealApi: normalizedGames.length > 0,
    dataQuality: normalizedGames.length > 0 ? "official_mlb_schedule" : "official_mlb_empty_schedule",
    source: "mlb_statsapi_schedule",
    date,
    games: normalizedGames,
    warnings,
    updatedAt,
    meta: buildApiMeta({
      source: "mlb_statsapi_schedule",
      dataQuality: normalizedGames.length > 0 ? "official_mlb_schedule" : "limited",
      updatedAt,
      warnings,
      cache: { strategy: "sports_http_ttl_stale_if_error", ttlMs: 45_000 },
    }),
  };
}

export async function getLiveGames(date = todayISO()): Promise<LiveGamesResponse> {
  const scheduleGames = await getScheduleByDate(date);
  const normalizedGames = scheduleGames.map(normalizeScheduleGame).filter((game) => game.id);
  const warnings = normalizedGames.length > 0
    ? ["Probability fields are unavailable until a backed model is connected; no synthetic projections returned."]
    : ["Official MLB schedule returned no games for this date; no mock games were substituted."];
  const updatedAt = new Date().toISOString();

  return {
    success: true,
    isRealApi: normalizedGames.length > 0,
    dataQuality: normalizedGames.length > 0 ? "official_mlb_schedule" : "official_mlb_empty_schedule",
    source: "mlb_statsapi_schedule",
    date,
    games: normalizedGames,
    warnings,
    updatedAt,
    meta: buildApiMeta({
      source: "mlb_statsapi_schedule",
      dataQuality: normalizedGames.length > 0 ? "official_mlb_schedule" : "limited",
      updatedAt,
      warnings,
      cache: { strategy: "shared_schedule_cache", ttlMs: 5 * 60_000 },
    }),
  };
}
