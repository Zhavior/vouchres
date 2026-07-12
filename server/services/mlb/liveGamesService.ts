import { getScheduleForLiveBoard, todayISO } from "./mlbClient";
import { isMlbFinalStatusText, isMlbLiveStatus } from "./gameStatus";
import { MlbScheduleGame, parseMlbScheduleResponse } from "./mlbStatsApiSchemas";
import { buildApiMeta, type ApiResponseMeta } from "../../lib/apiResponseMeta";
import type { NormalizedGame } from "./mlbTypes";
import {
  getSharedGameFeedsBatch,
  LIVE_HUB_TTL_MS,
  overlayFeedScoreOnCard,
  type LiveGameScore,
  type SharedGameFeedSnapshot,
} from "../hubs/liveGameHub";
import { getCachedLiveGamesBoard } from "./liveGamesBoardCache";

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
  homeAbbr: string | null;
  awayAbbr: string | null;
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  venue: string | null;
  gameDate: string | null;
  isLive: boolean;
  isFinal: boolean;
  inning: number | null;
  halfInning: string | null;
  outs: number | null;
  liveStateLabel: string | null;
  feedAsOf: string | null;
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
  liveCount: number;
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

function safeAbbr(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim().toUpperCase() : null;
}

function formatLiveStateLabel(score: LiveGameScore): string | null {
  if (score.inning == null) return null;
  const half = score.halfInning ? `${score.halfInning} ` : "";
  const outs =
    score.outs != null ? ` · ${score.outs} out${score.outs === 1 ? "" : "s"}` : "";
  return `${half}${score.inning}${outs}`;
}

function cardBaseFields(): Pick<
  LiveGameCard,
  "isApiReal" | "predictionsAvailable" | "predictionStatus" | "predictionSource" | "predictions"
> {
  return {
    isApiReal: true,
    predictionsAvailable: false,
    predictionStatus: "unavailable",
    predictionSource: "not_computed",
    predictions: EMPTY_PREDICTIONS,
  };
}

function normalizeLiveGame(game: MlbScheduleGame): LiveGameCard {
  const status = game.status?.detailedState ?? game.status?.abstractGameState;

  return {
    id: String(game.gamePk),
    homeTeam: safeName(game.teams?.home?.team?.name, "Home Team"),
    awayTeam: safeName(game.teams?.away?.team?.name, "Away Team"),
    homeAbbr: safeAbbr(game.teams?.home?.team?.abbreviation),
    awayAbbr: safeAbbr(game.teams?.away?.team?.abbreviation),
    homeTeamId: safeScore(game.teams?.home?.team?.id),
    awayTeamId: safeScore(game.teams?.away?.team?.id),
    homeScore: safeScore(game.teams?.home?.score),
    awayScore: safeScore(game.teams?.away?.score),
    status: safeName(status, "Scheduled"),
    venue: typeof game.venue?.name === "string" && game.venue.name.trim() ? game.venue.name.trim() : null,
    gameDate: typeof game.gameDate === "string" ? game.gameDate : null,
    isLive: isMlbLiveStatus(status),
    isFinal: isMlbFinalStatusText(status),
    inning: null,
    halfInning: null,
    outs: null,
    liveStateLabel: null,
    feedAsOf: null,
    ...cardBaseFields(),
  };
}

function normalizeScheduleGame(game: NormalizedGame): LiveGameCard {
  return {
    id: String(game.gamePk),
    homeTeam: safeName(game.homeTeam.name, "Home Team"),
    awayTeam: safeName(game.awayTeam.name, "Away Team"),
    homeAbbr: safeAbbr(game.homeTeam.abbreviation),
    awayAbbr: safeAbbr(game.awayTeam.abbreviation),
    homeTeamId: game.homeTeam.teamId ?? null,
    awayTeamId: game.awayTeam.teamId ?? null,
    homeScore: safeScore(game.score.home),
    awayScore: safeScore(game.score.away),
    status: safeName(game.status, "Scheduled"),
    venue: game.venue && game.venue !== "TBD" ? game.venue : null,
    gameDate: game.gameDate || null,
    isLive: isMlbLiveStatus(game.status),
    isFinal: isMlbFinalStatusText(game.status),
    inning: game.inning ?? game.linescore?.currentInning ?? null,
    halfInning: game.linescore?.inningState ?? null,
    outs: null,
    liveStateLabel: null,
    feedAsOf: null,
    ...cardBaseFields(),
  };
}

function enrichCardWithFeed(card: LiveGameCard, score: LiveGameScore): LiveGameCard {
  const overlaid = overlayFeedScoreOnCard(card, score);
  const live = isMlbLiveStatus(score.status) || card.isLive;
  const final = isMlbFinalStatusText(score.status) || card.isFinal;

  return {
    ...overlaid,
    isLive: live && !final,
    isFinal: final,
    inning: score.inning ?? card.inning,
    halfInning: score.halfInning ?? card.halfInning,
    outs: score.outs ?? card.outs,
    liveStateLabel: formatLiveStateLabel(score),
    feedAsOf: score.asOf,
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
    liveCount: normalizedGames.filter((game) => game.isLive && !game.isFinal).length,
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

async function buildLiveGamesBoard(date: string): Promise<LiveGamesResponse> {
  const scheduleGames = await getScheduleForLiveBoard(date);
  const cards = scheduleGames.map(normalizeScheduleGame).filter((game) => game.id);
  const liveCards = cards.filter((game) => game.isLive && !game.isFinal);

  const feedByPk: Map<number, SharedGameFeedSnapshot> =
    liveCards.length > 0
      ? await getSharedGameFeedsBatch(liveCards.map((card) => Number(card.id)))
      : new Map();

  const asOfTimes: string[] = [];

  const games = cards.map((card) => {
    const snapshot = feedByPk.get(Number(card.id));
    if (!snapshot) return card;
    asOfTimes.push(snapshot.score.asOf);
    return enrichCardWithFeed(card, snapshot.score);
  });

  const updatedAt =
    asOfTimes.length > 0
      ? asOfTimes.sort().at(-1) ?? new Date().toISOString()
      : new Date().toISOString();

  const liveCount = games.filter((game) => game.isLive && !game.isFinal).length;

  const warnings =
    games.length > 0
      ? [
          "Probability fields are unavailable until a backed model is connected; no synthetic projections returned.",
          ...(liveCards.length > 0
            ? [
                "Live scores and inning context for in-progress games come from the shared live feed hub (same source as at-bat view).",
              ]
            : []),
        ]
      : ["Official MLB schedule returned no games for this date; no mock games were substituted."];

  return {
    success: true,
    isRealApi: games.length > 0,
    dataQuality: games.length > 0 ? "official_mlb_schedule" : "official_mlb_empty_schedule",
    source: "mlb_statsapi_schedule",
    date,
    games,
    liveCount,
    warnings,
    updatedAt,
    meta: buildApiMeta({
      source: "live_game_board",
      dataQuality: games.length > 0 ? "official_mlb_schedule" : "limited",
      updatedAt,
      warnings,
      cache: {
        strategy: "live_game_board_swr",
        ttlMs: LIVE_HUB_TTL_MS,
        asOf: updatedAt,
      },
    }),
  };
}

/** Cached live games board — schedule + hub overlay + inning context in one payload. */
export async function getLiveGames(date = todayISO()): Promise<LiveGamesResponse> {
  return getCachedLiveGamesBoard(`live-board:${date}`, () => buildLiveGamesBoard(date));
}
