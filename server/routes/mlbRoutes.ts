/** MLB data + intelligence report routes. */
import type { Express, Request, Response } from "express";
import { getTodayGames, getScheduleByDate, getGameFeed, getProbablePitchers, todayISO } from "../services/mlb/mlbClient";
import { getSharedDailyReport } from "../services/intelligence/mlbIntelligenceEngine";
import { headshotUrl } from "../services/mlb/mlbTypes";
import { getLiveGames } from "../services/mlb/liveGamesService";
import { TTL, TTLCache } from "../lib/cache";
import { asyncHandler } from "../lib/asyncHandler";
import { sportsFetchJson } from "../lib/sports/sportsHttpClient";
import {
  optionalYmd as optionalDateQuery,
  positiveInt as requiredPositiveIntParam,
  requiredYmd as requiredDateParam,
  upstreamUnavailable,
  ymdOrDefault,
} from "../lib/requestValidators";

const MLB_BASE = (process.env.MLB_API_BASE_URL || "https://statsapi.mlb.com/api").replace(/\/$/, "");
const lineupCache = new TTLCache<any[]>(TTL.liveFeed, "mlb:lineups");

function dateQueryOrToday(value: unknown, field = "date"): string {
  return ymdOrDefault(value, todayISO(), field);
}

async function fetchMlb<T>(path: string): Promise<T> {
  const start = Date.now();
  console.log(`[mlbRoutes] MLB request ${path}`);
  const data = await sportsFetchJson<T>(`${MLB_BASE}${path}`, {
    cacheKey: `mlbRoutes:${path}`,
    ttlMs: 60_000,
    timeoutMs: 10_000,
    retries: 1,
    debugLabel: "mlbRoutes",
  });
  console.log(`[mlbRoutes] MLB request complete ${path} ${Date.now() - start}ms`);
  return data;
}

function normalizeBat(value: unknown): "L" | "R" | "S" | "U" {
  return value === "L" || value === "R" || value === "S" ? value : "U";
}

function normalizeThrow(value: unknown): "L" | "R" | "U" {
  return value === "L" || value === "R" ? value : "U";
}

async function fetchPlayerHandedness(playerIds: number[]) {
  const uniqueIds = [...new Set(playerIds.filter((id) => Number.isFinite(id)))];
  const hands = new Map<number, { bats: "L" | "R" | "S" | "U"; throws: "L" | "R" | "U" }>();

  for (let i = 0; i < uniqueIds.length; i += 75) {
    const batch = uniqueIds.slice(i, i + 75);
    if (!batch.length) continue;

    const data = await fetchMlb<any>(`/v1/people?personIds=${batch.join(",")}`);
    for (const person of data?.people ?? []) {
      hands.set(Number(person.id), {
        bats: normalizeBat(person?.batSide?.code),
        throws: normalizeThrow(person?.pitchHand?.code),
      });
    }
  }

  return hands;
}

/** Fetch all lineups for today's games from the MLB Stats API */
async function getTodayLineups(date: string) {
  return lineupCache.getOrSet(`lineups:${date}`, async () => {
    const data = await fetchMlb<any>(
      `/v1/schedule?sportId=1&date=${date}&hydrate=lineups,probablePitcher(note),team,linescore`
    );

    const games: any[] = data?.dates?.[0]?.games ?? [];
    const playerIds = games.flatMap((game: any) => [
      ...(game.lineups?.awayPlayers ?? []).map((p: any) => Number(p.id)),
      ...(game.lineups?.homePlayers ?? []).map((p: any) => Number(p.id)),
      Number(game.teams?.away?.probablePitcher?.id),
      Number(game.teams?.home?.probablePitcher?.id),
    ]);
    const handedness = await fetchPlayerHandedness(playerIds);

    return games.map((game: any) => {
      const awayTeam = { id: game.teams?.away?.team?.id, name: game.teams?.away?.team?.name, abbrev: game.teams?.away?.team?.abbreviation };
      const homeTeam = { id: game.teams?.home?.team?.id, name: game.teams?.home?.team?.name, abbrev: game.teams?.home?.team?.abbreviation };

      const mapPlayers = (players: any[], team: typeof awayTeam) =>
        (players ?? []).map((p: any, idx: number) => ({
          playerId: p.id,
          playerName: p.fullName ?? "Unknown",
          position: p.primaryPosition?.abbreviation ?? "—",
          battingOrder: idx + 1,
          bats: handedness.get(Number(p.id))?.bats ?? normalizeBat(p.batSide?.code),
          team: team.name,
          teamId: team.id,
          teamAbbrev: team.abbrev,
          headshot: headshotUrl(p.id),
        }));

      const awayLineup = mapPlayers(game.lineups?.awayPlayers ?? [], awayTeam);
      const homeLineup = mapPlayers(game.lineups?.homePlayers ?? [], homeTeam);

      const awayPitcher = game.teams?.away?.probablePitcher;
      const homePitcher = game.teams?.home?.probablePitcher;

      return {
        gamePk: game.gamePk,
        gameDate: game.gameDate,
        status: game.status?.detailedState ?? game.status?.abstractGameState ?? "Scheduled",
        venue: game.venue?.name ?? "TBD",
        awayTeam,
        homeTeam,
        awayPitcher: awayPitcher ? { id: awayPitcher.id, name: awayPitcher.fullName, throws: handedness.get(Number(awayPitcher.id))?.throws ?? normalizeThrow(awayPitcher.pitchHand?.code), headshot: headshotUrl(awayPitcher.id) } : null,
        homePitcher: homePitcher ? { id: homePitcher.id, name: homePitcher.fullName, throws: handedness.get(Number(homePitcher.id))?.throws ?? normalizeThrow(homePitcher.pitchHand?.code), headshot: headshotUrl(homePitcher.id) } : null,
        awayLineup,
        homeLineup,
        lineupConfirmed: awayLineup.length > 0 || homeLineup.length > 0,
        totalPlayers: awayLineup.length + homeLineup.length,
      };
    });
  });
}

export function registerMlbRoutes(app: Express): void {
  app.get("/api/mlb/live", asyncHandler(async (req: Request, res: Response) => {
    const date = dateQueryOrToday(req.query.date);
    res.json(await getLiveGames(date));
  }));

  app.get("/api/mlb/games/today", asyncHandler(async (_req: Request, res: Response) => {
    const start = Date.now();
    res.json({ date: todayISO(), games: await getTodayGames(), warnings: [] });
    console.log(`[endpoint] GET /api/mlb/games/today ${Date.now() - start}ms`);
  }));

  /** All lineups for today — powers the Daily Players board */
  const lineupTodayHandler = async (req: Request, res: Response) => {
    const start = Date.now();
    const date = dateQueryOrToday(req.query.date);
    try {
      const lineups = await getTodayLineups(date);
      const totalPlayers = lineups.reduce((sum, g) => sum + g.totalPlayers, 0);
      res.json({
        ok: true,
        date,
        games: lineups,
        totalGames: lineups.length,
        totalPlayers,
        source: "mlb_statsapi_live",
        updatedAt: new Date().toISOString(),
        warnings: [],
      });
    } catch (err: any) {
      console.error("[mlbRoutes] lineup/today failed:", err?.message);
      res.status(503).json({ ok: false, error: "Lineup data unavailable", message: err?.message, games: [], totalPlayers: 0, warnings: [err?.message ?? "Lineup data unavailable"] });
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
    res.json({ date, games: await getScheduleByDate(date), warnings: [] });
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
      res.json(report);
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
