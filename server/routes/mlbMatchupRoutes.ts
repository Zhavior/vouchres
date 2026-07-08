/** Premium Live Games matchup routes. */
import type { Express, Request, Response } from "express";
import { getGameMatchups, getGameMatchup, getLiveMatchupMatrix, getMatchupMatrix } from "../services/mlb/gameMatchupService";
import { buildSportsTruthSnapshot } from "../services/hubs/sportsTruthHub";
import { getPitcherMatchup } from "../services/mlb/pitcherMatchupService";
import { getTodayGamesWeather } from "../services/mlb/weatherService";
import { getStatcastBatterMap, STATCAST_MIN_PA } from "../services/mlb/statcastClient";
import { getScheduleByDate, todayISO } from "../services/mlb/mlbClient";
import { isMlbFinalStatusText, isMlbLiveStatus } from "../services/mlb/gameStatus";
import { TTLCache } from "../lib/cache";
import { isUpstashEnabled, redisGetJson, redisSetJson } from "../lib/upstashRedis";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../errors/AppError";
import {
  optionalYmd as optionalDateQuery,
  positiveInt as requiredPositiveIntParam,
  requiredYmd as requiredDateParam,
  upstreamUnavailable,
  ymdOrDefault,
} from "../lib/requestValidators";

const scoresCache = new TTLCache<unknown>(45_000);

function dateQueryOrToday(value: unknown, field = "date"): string {
  return ymdOrDefault(value, todayISO(), field);
}

export function registerMatchupRoutes(app: Express): void {
  /** Lightweight live scores — schedule + linescore only, no roster work. 45s TTL. */
  app.get("/api/mlb/scores/today", asyncHandler(async (_req: Request, res: Response) => {
    try {
      const date = todayISO();
      const scores = await scoresCache.getOrSet(`scores:${date}`, async () => {
        const games = await getScheduleByDate(date);
        return games.map((g) => ({
          gamePk: g.gamePk,
          status: g.status,
          isLive: isMlbLiveStatus(g.status),
          isFinal: isMlbFinalStatusText(g.status),
          inning: g.inning ?? null,
          inningState: g.linescore?.inningState ?? null,
          score: g.score,
        }));
      }, 45_000);
      res.json({ scores, updatedAt: new Date().toISOString() });
    } catch (err: any) {
      console.error("[scores/today] failed:", err?.message);
      throw upstreamUnavailable("Scores unavailable.", err);
    }
  }));

  app.get("/api/internal/sports-truth/mlb/today", asyncHandler(async (req: Request, res: Response) => {
    try {
      const date = dateQueryOrToday(req.query.date);
      const snapshot = await buildSportsTruthSnapshot({ sport: "mlb", date, live: true });
      res.json(snapshot);
    } catch (err: any) {
      console.error("[sports-truth/mlb/today] failed:", err?.message);
      if (err instanceof AppError) throw err;
      throw upstreamUnavailable("Sports truth snapshot unavailable.", err);
    }
  }));

  app.get("/api/mlb/matchups/today", asyncHandler(async (_req: Request, res: Response) => {
    try {
      const date = todayISO();
      const snapshot = await buildSportsTruthSnapshot({ sport: "mlb", date, live: true });
      console.log(`[MATCHUPS_TODAY] served from SportsTruthHub date=${date}`);
      res.json({ count: snapshot.matchups.length, matchups: snapshot.matchups, generatedAt: snapshot.generatedAt });
    } catch (err: any) {
      console.error("[matchups/today] failed:", err?.message);
      throw upstreamUnavailable("Today matchups unavailable.", err);
    }
  }));

  app.get("/api/mlb/matchups/date/:date", asyncHandler(async (req: Request, res: Response) => {
    try {
      const date = requiredDateParam(req.params.date);
      const snapshot = await buildSportsTruthSnapshot({ sport: "mlb", date, live: true });
      console.log(`[MATCHUPS_DATE] served from SportsTruthHub date=${date}`);
      res.json({ count: snapshot.matchups.length, matchups: snapshot.matchups, generatedAt: snapshot.generatedAt });
    } catch (err: any) {
      console.error("[matchups/date] failed:", err?.message);
      if (err instanceof AppError) throw err;
      throw upstreamUnavailable("Date matchups unavailable.", err);
    }
  }));

  app.get("/api/mlb/matchup-matrix", asyncHandler(async (req: Request, res: Response) => {
    try {
      const date = dateQueryOrToday(req.query.date);
      const matrix = await getMatchupMatrix(date);
      res.json(matrix);
    } catch (err: any) {
      console.error("[matchup-matrix] failed:", err?.message);
      if (err instanceof AppError) throw err;
      throw upstreamUnavailable("Matchup matrix unavailable.", err);
    }
  }));

  app.get("/api/mlb/matchup-matrix/live", asyncHandler(async (req: Request, res: Response) => {
    try {
      const date = dateQueryOrToday(req.query.date);

      const snapshot = await buildSportsTruthSnapshot({ sport: "mlb", date, live: true });
      console.log(`[MATCHUP_MATRIX_LIVE] served from SportsTruthHub date=${date}`);

      res.json(snapshot.matchupMatrix);
    } catch (err: any) {
      console.error("[matchup-matrix/live] failed:", err?.message);
      if (err instanceof AppError) throw err;
      throw upstreamUnavailable("Live matchup matrix unavailable.", err);
    }
  }));

  app.get("/api/mlb/matchup/:gamePk", asyncHandler(async (req: Request, res: Response) => {
    const gamePk = requiredPositiveIntParam(req.params.gamePk, "gamePk");
    const date = optionalDateQuery(req.query.date);
    const m = await getGameMatchup(gamePk, date);
    if (!m) throw new AppError({ status: 404, code: "not_found", message: "Matchup not found." });
    res.json({ matchup: m });
  }));

  /** Pro Pitcher Matchup Drawer — pitcher card + opponent lineup with BvP. */
  app.get("/api/mlb/matchup-matrix/:gamePk/pitcher/:pitcherId", asyncHandler(async (req: Request, res: Response) => {
    try {
      const gamePk = requiredPositiveIntParam(req.params.gamePk, "gamePk");
      const pitcherId = requiredPositiveIntParam(req.params.pitcherId, "pitcherId");
      const date = optionalDateQuery(req.query.date);
      const result = await getPitcherMatchup(gamePk, pitcherId, date);
      if (!result) throw new AppError({ status: 404, code: "not_found", message: "Pitcher matchup not found." });
      res.json(result);
    } catch (err: any) {
      console.error("[matchup-matrix/pitcher] failed:", err?.message);
      if (err instanceof AppError) throw err;
      throw upstreamUnavailable("Pitcher matchup unavailable.", err);
    }
  }));

  /** Real first-pitch weather per game (Open-Meteo + sourced stadium table).
   *  Roofed venues are flagged; unknown venues return "unavailable" — never estimated. */
  app.get("/api/mlb/weather/today", asyncHandler(async (req: Request, res: Response) => {
    try {
      const date = optionalDateQuery(req.query.date);
      const weather = await getTodayGamesWeather(date);
      res.json({ weather, source: "open-meteo", updatedAt: new Date().toISOString() });
    } catch (err: any) {
      console.error("[weather/today] failed:", err?.message);
      if (err instanceof AppError) throw err;
      throw upstreamUnavailable("Weather unavailable.", err);
    }
  }));

  /** Season Statcast batter quality (Baseball Savant leaderboards, 12h cache).
   *  Players under the PA threshold are absent — nothing is estimated for them. */
  app.get("/api/mlb/statcast/batters", asyncHandler(async (_req: Request, res: Response) => {
    try {
      const batters = await getStatcastBatterMap();
      res.json({
        batters,
        count: Object.keys(batters).length,
        minPa: STATCAST_MIN_PA,
        scope: "season",
        source: "baseball-savant",
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("[statcast/batters] failed:", err?.message);
      throw upstreamUnavailable("Statcast batters unavailable.", err);
    }
  }));
}
