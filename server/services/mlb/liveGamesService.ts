import { sportsFetchJson } from "../../lib/sports/sportsHttpClient";
import { todayISO } from "./mlbClient";
import { isMlbFinalStatusText, isMlbLiveStatus } from "./gameStatus";
import { MlbScheduleGame, parseMlbScheduleResponse } from "./mlbStatsApiSchemas";

const MLB_BASE = (process.env.MLB_API_BASE_URL || "https://statsapi.mlb.com/api").replace(/\/$/, "");

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

export function buildLiveGamesResponse(scheduleData: unknown, date: string, now = new Date()): LiveGamesResponse {
  const { games, warnings: parseWarnings } = parseMlbScheduleResponse(scheduleData, `live:${date}`);
  const normalizedGames = games.map(normalizeLiveGame).filter((game) => game.id);

  return {
    success: true,
    isRealApi: normalizedGames.length > 0,
    dataQuality: normalizedGames.length > 0 ? "official_mlb_schedule" : "official_mlb_empty_schedule",
    source: "mlb_statsapi_schedule",
    date,
    games: normalizedGames,
    warnings: [
      ...parseWarnings,
      ...(normalizedGames.length > 0
        ? ["Probability fields are unavailable until a backed model is connected; no synthetic projections returned."]
        : ["Official MLB schedule returned no games for this date; no mock games were substituted."]),
    ],
    updatedAt: now.toISOString(),
  };
}

export async function getLiveGames(date = todayISO()): Promise<LiveGamesResponse> {
  const url = `${MLB_BASE}/v1/schedule?sportId=1&date=${encodeURIComponent(date)}&hydrate=linescore,team,venue`;
  const scheduleData = await sportsFetchJson<unknown>(url, {
    cacheKey: `mlb-live:${date}`,
    ttlMs: 45_000,
    staleIfErrorMs: 90_000,
    timeoutMs: 5_000,
    retries: 1,
    debugLabel: "mlbLiveGames",
  });

  return buildLiveGamesResponse(scheduleData, date);
}
