/** MLB data + intelligence report routes. */
import type { Express, Request, Response } from "express";
import { getTodayGames, getScheduleByDate, getGameFeed, getProbablePitchers, todayISO } from "../services/mlb/mlbClient";
import { getSharedDailyReport } from "../services/intelligence/mlbIntelligenceEngine";
import { getLiveGames } from "../services/mlb/liveGamesService";
import { TTL } from "../lib/cache";
import { asyncHandler } from "../lib/asyncHandler";
import { buildApiMeta } from "../lib/apiResponseMeta";
import { getMlbHealthReport } from "../services/mlb/mlbHealthService";
import { getTodayLineups } from "../services/mlb/lineupService";
import {
  optionalYmd as optionalDateQuery,
  positiveInt as requiredPositiveIntParam,
  requiredYmd as requiredDateParam,
  upstreamUnavailable,
  ymdOrDefault,
} from "../lib/requestValidators";

function dateQueryOrToday(value: unknown, field = "date"): string {
  return ymdOrDefault(value, todayISO(), field);
}

export function registerMlbRoutes(app: Express): void {
  app.get("/api/health/mlb", asyncHandler(async (req: Request, res: Response) => {
    const date = dateQueryOrToday(req.query.date);
    const report = await getMlbHealthReport(date);
    res.status(report.status === "down" ? 503 : 200).json({ ok: report.status !== "down", ...report });
  }));

  app.get("/api/mlb/live", asyncHandler(async (req: Request, res: Response) => {
    const date = dateQueryOrToday(req.query.date);
    res.json({ ok: true, ...(await getLiveGames(date)) });
  }));

  app.get("/api/mlb/games/today", asyncHandler(async (_req: Request, res: Response) => {
    const start = Date.now();
    res.json({ ok: true, date: todayISO(), games: await getTodayGames(), warnings: [] });
    console.log(`[endpoint] GET /api/mlb/games/today ${Date.now() - start}ms`);
  }));

  /** All lineups for today — powers the Daily Players board */
  const lineupTodayHandler = async (req: Request, res: Response) => {
    const start = Date.now();
    const date = dateQueryOrToday(req.query.date);
    try {
      const { lineups, warnings, servedFromLastGood } = await getTodayLineups(date);
      const totalPlayers = lineups.reduce((sum, g) => sum + g.totalPlayers, 0);
      res.json({
        ok: true,
        date,
        games: lineups,
        totalGames: lineups.length,
        totalPlayers,
        source: servedFromLastGood ? "mlb_statsapi_lineups_last_good" : "mlb_statsapi_live",
        updatedAt: new Date().toISOString(),
        warnings,
        meta: buildApiMeta({
          source: servedFromLastGood ? "mlb_statsapi_lineups_last_good" : "mlb_statsapi_lineups",
          dataQuality: servedFromLastGood ? "cached_official_mlb_lineup" : "official_mlb_lineup",
          warnings,
          cache: {
            strategy: servedFromLastGood ? "lineup_last_good_snapshot" : "ttl_cache",
            ttlMs: TTL.liveFeed,
          },
        }),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lineup data unavailable";
      console.error("[mlbRoutes] lineup/today failed:", message);
      throw upstreamUnavailable("Lineup data unavailable", err);
    } finally {
      console.log(`[endpoint] GET /api/mlb/lineup/today ${Date.now() - start}ms`);
    }
  };

  app.get("/api/mlb/lineup/today", asyncHandler(lineupTodayHandler));
  app.get("/api/mlb/daily-player-board", asyncHandler(lineupTodayHandler));
  app.get("/api/daily-players", asyncHandler(lineupTodayHandler));

  app.get("/api/mlb/games/date/:date", asyncHandler(async (req: Request, res: Response) => {
    const start = Date.now();
    const date = requiredDateParam(req.params.date);
    const games = await getScheduleByDate(date);
    res.json({
      date,
      games,
      warnings: [],
      meta: buildApiMeta({
        source: "mlb_statsapi_schedule",
        dataQuality: games.length > 0 ? "official_mlb_schedule" : "limited",
        warnings: [],
      }),
    });
    console.log(`[endpoint] GET /api/mlb/games/date/:date ${Date.now() - start}ms`);
  }));

  app.get("/api/mlb/game/:gamePk", asyncHandler(async (req: Request, res: Response) => {
    const start = Date.now();
    const gamePk = requiredPositiveIntParam(req.params.gamePk, "gamePk");
    const feed = await getGameFeed(gamePk);
    if (!feed) {
      console.log(`[endpoint] GET /api/mlb/game/:gamePk ${Date.now() - start}ms`);
      return res.json({ status: "limited", dataQuality: "limited", feed: null, warnings: ["Live game feed unavailable"] });
    }
    res.json({ status: "success", feed, warnings: [] });
    console.log(`[endpoint] GET /api/mlb/game/:gamePk ${Date.now() - start}ms`);
  }));

  app.get("/api/mlb/probable-pitchers/:date", asyncHandler(async (req: Request, res: Response) => {
    const start = Date.now();
    const date = requiredDateParam(req.params.date);
    res.json({ date, pitchers: await getProbablePitchers(date), warnings: [] });
    console.log(`[endpoint] GET /api/mlb/probable-pitchers/:date ${Date.now() - start}ms`);
  }));

  app.get("/api/mlb/reports/daily", asyncHandler(async (req: Request, res: Response) => {
    const start = Date.now();
    const date = optionalDateQuery(req.query.date);
    try {
      const report = await getSharedDailyReport(date);
      res.json({ ok: true, ...report });
    } catch (err: any) {
      throw upstreamUnavailable("Daily report unavailable.", err);
    } finally {
      console.log(`[endpoint] GET /api/mlb/reports/daily ${Date.now() - start}ms`);
    }
  }));

  app.get("/api/mlb/reports/vulnerable-pitchers", asyncHandler(async (req: Request, res: Response) => {
    const date = optionalDateQuery(req.query.date);
    try {
      const report = await getSharedDailyReport(date);
      res.json({ report: report.vulnerablePitchers, warnings: report.warnings });
    } catch (err: any) {
      throw upstreamUnavailable("Vulnerable pitchers unavailable.", err);
    }
  }));

  app.get("/api/mlb/reports/hr-targets", asyncHandler(async (req: Request, res: Response) => {
    const date = optionalDateQuery(req.query.date);
    try {
      const report = await getSharedDailyReport(date);
      res.json({ targets: report.hrTargets, warnings: report.warnings });
    } catch (err: any) {
      throw upstreamUnavailable("HR targets unavailable.", err);
    }
  }));

  app.get("/api/mlb/reports/sneaky-hr", asyncHandler(async (req: Request, res: Response) => {
    const date = optionalDateQuery(req.query.date);
    try {
      const report = await getSharedDailyReport(date);
      res.json({ sneaky: report.sneakyHr, warnings: report.warnings });
    } catch (err: any) {
      throw upstreamUnavailable("Sneaky HR unavailable.", err);
    }
  }));

  app.get("/api/mlb/reports/rbi-targets", asyncHandler(async (req: Request, res: Response) => {
    const date = optionalDateQuery(req.query.date);
    try {
      const report = await getSharedDailyReport(date);
      res.json({ ...report.rbi, warnings: report.warnings });
    } catch (err: any) {
      throw upstreamUnavailable("RBI targets unavailable.", err);
    }
  }));

  app.get("/api/mlb/reports/run-environments", asyncHandler(async (req: Request, res: Response) => {
    const date = optionalDateQuery(req.query.date);
    try {
      const report = await getSharedDailyReport(date);
      res.json({ environments: report.runEnvironments, warnings: report.warnings });
    } catch (err: any) {
      throw upstreamUnavailable("Run environments unavailable.", err);
    }
  }));
}
