/** MLB data + intelligence report routes. */
import type { Express, Request, Response } from "express";
import { getTodayGames, getScheduleByDate, getGameFeed, getProbablePitchers, todayISO } from "../services/mlb/mlbClient";
import { getSharedDailyReport } from "../services/intelligence/mlbIntelligenceEngine";
import { getLiveGames } from "../services/mlb/liveGamesService";
import { TTL } from "../lib/cache";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import { buildApiMeta } from "../lib/apiResponseMeta";
import { structuredLog } from "../lib/structuredLog";
import { getMlbHealthReport } from "../services/mlb/mlbHealthService";
import { getTodayLineups } from "../services/mlb/lineupService";
import type { RequestWithContext } from "../middleware/requestContext";
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

function logEndpoint(req: RequestWithContext, route: string, start: number, extra?: Record<string, unknown>) {
  structuredLog({
    level: "info",
    event: "endpoint",
    requestId: req.requestId,
    method: "GET",
    route,
    durationMs: Date.now() - start,
    ...extra,
  });
}

export function registerMlbRoutes(app: Express): void {
  app.get("/api/health/mlb", asyncHandler(async (req: RequestWithContext, res: Response) => {
    const date = dateQueryOrToday(req.query.date);
    const report = await getMlbHealthReport(date);
    const status = report.status === "down" ? 503 : 200;
    return res.status(status).json(apiOkFlat(req, report as unknown as Record<string, unknown>));
  }));

  app.get("/api/mlb/live", asyncHandler(async (req: RequestWithContext, res: Response) => {
    const date = dateQueryOrToday(req.query.date);
    const live = await getLiveGames(date);
    return res.json(apiOkFlat(req, live as unknown as Record<string, unknown>));
  }));

  app.get("/api/mlb/games/today", asyncHandler(async (req: RequestWithContext, res: Response) => {
    const start = Date.now();
    const payload = apiOkFlat(req, {
      date: todayISO(),
      games: await getTodayGames(),
      warnings: [],
    });
    res.json(payload);
    logEndpoint(req, "/api/mlb/games/today", start);
  }));

  /** All lineups for today — powers the Daily Players board */
  const lineupTodayHandler = async (req: RequestWithContext, res: Response) => {
    const start = Date.now();
    const date = dateQueryOrToday(req.query.date);
    try {
      const { lineups, warnings, servedFromLastGood } = await getTodayLineups(date);
      const totalPlayers = lineups.reduce((sum, g) => sum + g.totalPlayers, 0);
      const lineupWarnings = servedFromLastGood
        ? [...warnings, "Lineup served from last-good cache snapshot."]
        : warnings;
      res.json(apiOkFlat(req, {
        date,
        games: lineups,
        totalGames: lineups.length,
        totalPlayers,
        source: servedFromLastGood ? "mlb_statsapi_lineups_last_good" : "mlb_statsapi_live",
        updatedAt: new Date().toISOString(),
        warnings: lineupWarnings,
        meta: buildApiMeta({
          source: servedFromLastGood ? "mlb_statsapi_lineups_last_good" : "mlb_statsapi_lineups",
          dataQuality: "official_mlb_lineup",
          warnings: lineupWarnings,
          cache: {
            strategy: servedFromLastGood ? "lineup_last_good_snapshot" : "ttl_cache",
            ttlMs: TTL.liveFeed,
          },
        }),
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lineup data unavailable";
      console.error("[mlbRoutes] lineup/today failed:", message);
      throw upstreamUnavailable("Lineup data unavailable", err);
    } finally {
      structuredLog({
        level: "info",
        event: "endpoint",
        requestId: req.requestId,
        method: "GET",
        route: "/api/mlb/lineup/today",
        durationMs: Date.now() - start,
      });
    }
  };

  app.get("/api/mlb/lineup/today", asyncHandler(lineupTodayHandler));
  app.get("/api/mlb/daily-player-board", asyncHandler(lineupTodayHandler));
  app.get("/api/daily-players", asyncHandler(lineupTodayHandler));

  app.get("/api/mlb/games/date/:date", asyncHandler(async (req: RequestWithContext, res: Response) => {
    const start = Date.now();
    const date = requiredDateParam(req.params.date);
    const games = await getScheduleByDate(date);
    res.json(apiOkFlat(req, {
      date,
      games,
      warnings: [],
      meta: buildApiMeta({
        source: "mlb_statsapi_schedule",
        dataQuality: games.length > 0 ? "official_mlb_schedule" : "limited",
        warnings: [],
      }),
    }));
    logEndpoint(req, "/api/mlb/games/date/:date", start);
  }));

  app.get("/api/mlb/game/:gamePk", asyncHandler(async (req: RequestWithContext, res: Response) => {
    const start = Date.now();
    const gamePk = requiredPositiveIntParam(req.params.gamePk, "gamePk");
    const feed = await getGameFeed(gamePk);
    if (!feed) {
      logEndpoint(req, "/api/mlb/game/:gamePk", start, { limited: true });
      return res.json(apiOkFlat(req, {
        status: "limited",
        dataQuality: "limited",
        feed: null,
        warnings: ["Live game feed unavailable"],
      }));
    }
    res.json(apiOkFlat(req, { status: "success", feed, warnings: [] }));
    logEndpoint(req, "/api/mlb/game/:gamePk", start);
  }));

  app.get("/api/mlb/probable-pitchers/:date", asyncHandler(async (req: RequestWithContext, res: Response) => {
    const start = Date.now();
    const date = requiredDateParam(req.params.date);
    res.json(apiOkFlat(req, {
      date,
      pitchers: await getProbablePitchers(date),
      warnings: [],
    }));
    logEndpoint(req, "/api/mlb/probable-pitchers/:date", start);
  }));

  app.get("/api/mlb/reports/daily", asyncHandler(async (req: RequestWithContext, res: Response) => {
    const start = Date.now();
    const date = optionalDateQuery(req.query.date);
    try {
      const report = await getSharedDailyReport(date);
      res.json(apiOkFlat(req, report as unknown as Record<string, unknown>));
    } catch (err: any) {
      throw upstreamUnavailable("Daily report unavailable.", err);
    } finally {
      logEndpoint(req, "/api/mlb/reports/daily", start);
    }
  }));

  app.get("/api/mlb/reports/vulnerable-pitchers", asyncHandler(async (req: RequestWithContext, res: Response) => {
    const date = optionalDateQuery(req.query.date);
    try {
      const report = await getSharedDailyReport(date);
      res.json(apiOkFlat(req, { report: report.vulnerablePitchers, warnings: report.warnings }));
    } catch (err: any) {
      throw upstreamUnavailable("Vulnerable pitchers unavailable.", err);
    }
  }));

  app.get("/api/mlb/reports/hr-targets", asyncHandler(async (req: RequestWithContext, res: Response) => {
    const date = optionalDateQuery(req.query.date);
    try {
      const report = await getSharedDailyReport(date);
      res.json(apiOkFlat(req, { targets: report.hrTargets, warnings: report.warnings }));
    } catch (err: any) {
      throw upstreamUnavailable("HR targets unavailable.", err);
    }
  }));

  app.get("/api/mlb/reports/sneaky-hr", asyncHandler(async (req: RequestWithContext, res: Response) => {
    const date = optionalDateQuery(req.query.date);
    try {
      const report = await getSharedDailyReport(date);
      res.json(apiOkFlat(req, { sneaky: report.sneakyHr, warnings: report.warnings }));
    } catch (err: any) {
      throw upstreamUnavailable("Sneaky HR unavailable.", err);
    }
  }));

  app.get("/api/mlb/reports/rbi-targets", asyncHandler(async (req: RequestWithContext, res: Response) => {
    const date = optionalDateQuery(req.query.date);
    try {
      const report = await getSharedDailyReport(date);
      res.json(apiOkFlat(req, { ...report.rbi, warnings: report.warnings }));
    } catch (err: any) {
      throw upstreamUnavailable("RBI targets unavailable.", err);
    }
  }));

  app.get("/api/mlb/reports/run-environments", asyncHandler(async (req: RequestWithContext, res: Response) => {
    const date = optionalDateQuery(req.query.date);
    try {
      const report = await getSharedDailyReport(date);
      res.json(apiOkFlat(req, { environments: report.runEnvironments, warnings: report.warnings }));
    } catch (err: any) {
      throw upstreamUnavailable("Run environments unavailable.", err);
    }
  }));

  app.post("/api/mlb/parlay-leg-progress", asyncHandler(async (req: RequestWithContext, res: Response) => {
    const { fetchParlayLegProgressBatch } = await import("../services/mlb/parlayLiveProgressService");
    const legs = Array.isArray(req.body?.legs) ? req.body.legs : [];
    const progress = await fetchParlayLegProgressBatch(
      legs.map((leg: Record<string, unknown>, index: number) => ({
        id: String(leg.id ?? `leg-${index}`),
        gamePk: String(leg.gamePk ?? leg.game_pk ?? ""),
        playerId: leg.playerId ?? leg.player_id ?? "",
        marketCode: leg.marketCode ?? leg.market_code ?? null,
        statTarget: leg.statTarget ?? leg.stat_target ?? 1,
      })),
    );
    return res.json(apiOkFlat(req, { legs: progress }));
  }));

  app.post("/api/mlb/parlay-tier-odds", asyncHandler(async (req: RequestWithContext, res: Response) => {
    const { fetchLiveTierOdds } = await import("../services/mlb/parlayOddsFeedService");
    const quote = await fetchLiveTierOdds({
      playerName: req.body?.playerName ?? req.body?.player_name,
      teamName: req.body?.teamName ?? req.body?.team_name,
      homeTeam: req.body?.homeTeam ?? req.body?.home_team,
      awayTeam: req.body?.awayTeam ?? req.body?.away_team,
      marketCode: req.body?.marketCode ?? req.body?.market_code,
      statTarget: req.body?.statTarget ?? req.body?.stat_target,
    });
    return res.json(apiOkFlat(req, quote));
  }));

  app.post("/api/mlb/parlay-tier-odds/batch", asyncHandler(async (req: RequestWithContext, res: Response) => {
    const { fetchLiveTierOddsBatch } = await import("../services/mlb/parlayOddsFeedService");
    const tiers = Array.isArray(req.body?.tiers) ? req.body.tiers : [];
    const quotes = await fetchLiveTierOddsBatch({
      playerName: req.body?.playerName ?? req.body?.player_name,
      teamName: req.body?.teamName ?? req.body?.team_name,
      homeTeam: req.body?.homeTeam ?? req.body?.home_team,
      awayTeam: req.body?.awayTeam ?? req.body?.away_team,
      tiers: tiers.map((tier: Record<string, unknown>, index: number) => ({
        key: String(tier.key ?? tier.id ?? index),
        marketCode: tier.marketCode ?? tier.market_code,
        statTarget: tier.statTarget ?? tier.stat_target,
      })),
    });
    return res.json(apiOkFlat(req, { quotes }));
  }));
}
