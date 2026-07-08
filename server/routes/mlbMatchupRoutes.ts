/** Premium Live Games matchup routes. */
import type { Express, Request, Response } from "express";
import { getGameMatchup, getMatchupMatrix } from "../services/mlb/gameMatchupService";
import { buildSportsTruthSnapshot } from "../services/hubs/sportsTruthHub";
import { getPitcherMatchup } from "../services/mlb/pitcherMatchupService";
import { getTodayGamesWeather } from "../services/mlb/weatherService";
import { getStatcastBatterMap, STATCAST_MIN_PA } from "../services/mlb/statcastClient";
import { getScheduleByDate, todayISO } from "../services/mlb/mlbClient";
import { isMlbFinalStatusText, isMlbLiveStatus } from "../services/mlb/gameStatus";
import { TTLCache } from "../lib/cache";
import { asyncHandler } from "../lib/asyncHandler";
import { buildApiMeta } from "../lib/apiResponseMeta";
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

function rethrowOrUpstream(err: unknown, message: string): never {
  console.error("[matchupRoutes]", message, (err as Error)?.message);
  if (err instanceof AppError) throw err;
  throw upstreamUnavailable(message, err);
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
      const updatedAt = new Date().toISOString();
      res.json({
        ok: true,
        scores,
        updatedAt,
        meta: buildApiMeta({
          source: "mlb_statsapi_schedule_linescore",
          dataQuality: "official_mlb_scores",
          updatedAt,
          warnings: [],
          cache: { strategy: "ttl_cache", ttlMs: 45_000 },
        }),
      });
    } catch (err) {
      rethrowOrUpstream(err, "Scores unavailable.");
    }
  }));

  app.get("/api/internal/sports-truth/mlb/today", asyncHandler(async (req: Request, res: Response) => {
    try {
      const date = dateQueryOrToday(req.query.date);
      const snapshot = await buildSportsTruthSnapshot({ sport: "mlb", date, live: true });
      res.json({ ok: true, ...snapshot });
    } catch (err) {
      rethrowOrUpstream(err, "Sports truth snapshot unavailable.");
    }
  }));

  app.get("/api/mlb/matchups/today", asyncHandler(async (_req: Request, res: Response) => {
    try {
      const date = todayISO();
      const snapshot = await buildSportsTruthSnapshot({ sport: "mlb", date, live: true });
      console.log(`[MATCHUPS_TODAY] served from SportsTruthHub date=${date}`);
      res.json({
        ok: true,
        count: snapshot.matchups.length,
        matchups: snapshot.matchups,
        generatedAt: snapshot.generatedAt,
        meta: buildApiMeta({
          source: "sports_truth_hub",
          dataQuality: "sports_truth_snapshot",
          updatedAt: snapshot.generatedAt,
          generatedAt: snapshot.generatedAt,
          warnings: [],
          cache: { strategy: "sports_truth_hub_ttl", ttlMs: 300_000 },
        }),
      });
    } catch (err) {
      rethrowOrUpstream(err, "Today matchups unavailable.");
    }
  }));

  app.get("/api/mlb/matchups/date/:date", asyncHandler(async (req: Request, res: Response) => {
    try {
      const date = requiredDateParam(req.params.date);
      const snapshot = await buildSportsTruthSnapshot({ sport: "mlb", date, live: true });
      console.log(`[MATCHUPS_DATE] served from SportsTruthHub date=${date}`);
      res.json({
        ok: true,
        count: snapshot.matchups.length,
        matchups: snapshot.matchups,
        generatedAt: snapshot.generatedAt,
        meta: buildApiMeta({
          source: "sports_truth_hub",
          dataQuality: "sports_truth_snapshot",
          updatedAt: snapshot.generatedAt,
          generatedAt: snapshot.generatedAt,
          warnings: [],
          cache: { strategy: "sports_truth_hub_ttl", ttlMs: 300_000 },
        }),
      });
    } catch (err) {
      rethrowOrUpstream(err, "Date matchups unavailable.");
    }
  }));

  app.get("/api/mlb/matchup-matrix", asyncHandler(async (req: Request, res: Response) => {
    try {
      const date = dateQueryOrToday(req.query.date);
      const matrix = await getMatchupMatrix(date);
      res.json({ ok: true, ...matrix });
    } catch (err) {
      rethrowOrUpstream(err, "Matchup matrix unavailable.");
    }
  }));

  app.get("/api/mlb/matchup-matrix/live", asyncHandler(async (req: Request, res: Response) => {
    try {
      const date = dateQueryOrToday(req.query.date);
      const snapshot = await buildSportsTruthSnapshot({ sport: "mlb", date, live: true });
      console.log(`[MATCHUP_MATRIX_LIVE] served from SportsTruthHub date=${date}`);
      res.json({ ok: true, ...snapshot.matchupMatrix });
    } catch (err) {
      rethrowOrUpstream(err, "Live matchup matrix unavailable.");
    }
  }));

  app.get("/api/mlb/matchup/:gamePk", asyncHandler(async (req: Request, res: Response) => {
    const gamePk = requiredPositiveIntParam(req.params.gamePk, "gamePk");
    const date = optionalDateQuery(req.query.date);
    const m = await getGameMatchup(gamePk, date);
    if (!m) throw new AppError({ status: 404, code: "not_found", message: "Matchup not found." });
    res.json({ ok: true, matchup: m });
  }));

  app.get("/api/mlb/matchup-matrix/:gamePk/pitcher/:pitcherId", asyncHandler(async (req: Request, res: Response) => {
    try {
      const gamePk = requiredPositiveIntParam(req.params.gamePk, "gamePk");
      const pitcherId = requiredPositiveIntParam(req.params.pitcherId, "pitcherId");
      const date = optionalDateQuery(req.query.date);
      const result = await getPitcherMatchup(gamePk, pitcherId, date);
      if (!result) throw new AppError({ status: 404, code: "not_found", message: "Pitcher matchup not found." });
      res.json({ ok: true, ...result });
    } catch (err) {
      rethrowOrUpstream(err, "Pitcher matchup unavailable.");
    }
  }));

  app.get("/api/mlb/weather/today", asyncHandler(async (req: Request, res: Response) => {
    try {
      const date = optionalDateQuery(req.query.date);
      const weather = await getTodayGamesWeather(date);
      res.json({ ok: true, weather, source: "open-meteo", updatedAt: new Date().toISOString() });
    } catch (err) {
      rethrowOrUpstream(err, "Weather unavailable.");
    }
  }));

  app.get("/api/mlb/statcast/batters", asyncHandler(async (_req: Request, res: Response) => {
    try {
      const batters = await getStatcastBatterMap();
      res.json({
        ok: true,
        batters,
        count: Object.keys(batters).length,
        minPa: STATCAST_MIN_PA,
        scope: "season",
        source: "baseball-savant",
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      rethrowOrUpstream(err, "Statcast batters unavailable.");
    }
  }));
}
