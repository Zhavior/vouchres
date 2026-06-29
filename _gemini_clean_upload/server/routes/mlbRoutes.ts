/** MLB data + intelligence report routes. */
import type { Express, Request, Response } from "express";
import { getTodayGames, getScheduleByDate, getGameFeed, getProbablePitchers, todayISO } from "../services/mlb/mlbClient";
import { getSharedDailyReport } from "../services/intelligence/mlbIntelligenceEngine";
import { headshotUrl } from "../services/mlb/mlbTypes";

const MLB_BASE = (process.env.MLB_API_BASE_URL || "https://statsapi.mlb.com/api").replace(/\/$/, "");

async function fetchMlb<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${MLB_BASE}${path}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`MLB ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch all lineups for today's games from the MLB Stats API */
async function getTodayLineups(date: string) {
  const data = await fetchMlb<any>(
    `/v1/schedule?sportId=1&date=${date}&hydrate=lineups,probablePitcher(note),team,linescore`
  );

  const games: any[] = data?.dates?.[0]?.games ?? [];

  return games.map((game: any) => {
    const awayTeam = { id: game.teams?.away?.team?.id, name: game.teams?.away?.team?.name, abbrev: game.teams?.away?.team?.abbreviation };
    const homeTeam = { id: game.teams?.home?.team?.id, name: game.teams?.home?.team?.name, abbrev: game.teams?.home?.team?.abbreviation };

    const mapPlayers = (players: any[], team: typeof awayTeam) =>
      (players ?? []).map((p: any, idx: number) => ({
        playerId: p.id,
        playerName: p.fullName ?? "Unknown",
        position: p.primaryPosition?.abbreviation ?? "—",
        battingOrder: idx + 1,
        bats: p.batSide?.code ?? "U",
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
      awayPitcher: awayPitcher ? { id: awayPitcher.id, name: awayPitcher.fullName, throws: awayPitcher.pitchHand?.code ?? "U", headshot: headshotUrl(awayPitcher.id) } : null,
      homePitcher: homePitcher ? { id: homePitcher.id, name: homePitcher.fullName, throws: homePitcher.pitchHand?.code ?? "U", headshot: headshotUrl(homePitcher.id) } : null,
      awayLineup,
      homeLineup,
      lineupConfirmed: awayLineup.length > 0 || homeLineup.length > 0,
      totalPlayers: awayLineup.length + homeLineup.length,
    };
  });
}

export function registerMlbRoutes(app: Express): void {
  app.get("/api/mlb/games/today", async (_req: Request, res: Response) => {
    res.json({ date: todayISO(), games: await getTodayGames() });
  });

  /** All lineups for today — powers the Daily Players board */
  app.get("/api/mlb/lineup/today", async (req: Request, res: Response) => {
    const date = (req.query.date as string) || todayISO();
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
      });
    } catch (err: any) {
      console.error("[mlbRoutes] lineup/today failed:", err?.message);
      res.status(503).json({ ok: false, error: "Lineup data unavailable", message: err?.message, games: [], totalPlayers: 0 });
    }
  });

  app.get("/api/mlb/games/date/:date", async (req: Request, res: Response) => {
    res.json({ date: req.params.date, games: await getScheduleByDate(req.params.date) });
  });

  app.get("/api/mlb/game/:gamePk", async (req: Request, res: Response) => {
    const feed = await getGameFeed(Number(req.params.gamePk));
    if (!feed) return res.json({ status: "limited", dataQuality: "limited", feed: null });
    res.json({ status: "success", feed });
  });

  app.get("/api/mlb/probable-pitchers/:date", async (req: Request, res: Response) => {
    res.json({ date: req.params.date, pitchers: await getProbablePitchers(req.params.date) });
  });

  app.get("/api/mlb/reports/daily", async (req: Request, res: Response) => {
    try {
      const report = await getSharedDailyReport((req.query.date as string) || undefined);
      res.json(report);
    } catch (err: any) {
      res.status(503).json({ error: "Daily report unavailable", message: err?.message });
    }
  });

  app.get("/api/mlb/reports/vulnerable-pitchers", async (req: Request, res: Response) => {
    try {
      const report = await getSharedDailyReport((req.query.date as string) || undefined);
      res.json({ report: report.vulnerablePitchers });
    } catch (err: any) {
      res.status(503).json({ error: "Vulnerable pitchers unavailable", message: err?.message });
    }
  });

  app.get("/api/mlb/reports/hr-targets", async (req: Request, res: Response) => {
    try {
      const report = await getSharedDailyReport((req.query.date as string) || undefined);
      res.json({ targets: report.hrTargets });
    } catch (err: any) {
      res.status(503).json({ error: "HR targets unavailable", message: err?.message });
    }
  });

  app.get("/api/mlb/reports/sneaky-hr", async (req: Request, res: Response) => {
    try {
      const report = await getSharedDailyReport((req.query.date as string) || undefined);
      res.json({ sneaky: report.sneakyHr });
    } catch (err: any) {
      res.status(503).json({ error: "Sneaky HR unavailable", message: err?.message });
    }
  });

  app.get("/api/mlb/reports/rbi-targets", async (req: Request, res: Response) => {
    try {
      const report = await getSharedDailyReport((req.query.date as string) || undefined);
      res.json(report.rbi);
    } catch (err: any) {
      res.status(503).json({ error: "RBI targets unavailable", message: err?.message });
    }
  });

  app.get("/api/mlb/reports/run-environments", async (req: Request, res: Response) => {
    try {
      const report = await getSharedDailyReport((req.query.date as string) || undefined);
      res.json({ environments: report.runEnvironments });
    } catch (err: any) {
      res.status(503).json({ error: "Run environments unavailable", message: err?.message });
    }
  });
}
