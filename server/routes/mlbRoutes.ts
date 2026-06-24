/** MLB data + intelligence report routes. */
import type { Express, Request, Response } from "express";
import { getTodayGames, getScheduleByDate, getGameFeed, getProbablePitchers, todayISO } from "../services/mlb/mlbClient";
import { buildDailyReport } from "../services/intelligence/mlbIntelligenceEngine";
import { buildVulnerablePitcherReport } from "../services/intelligence/pitcherVulnerabilityEngine";
import { rankHrTargets, findSneakyHrTargets } from "../services/intelligence/hrEngine";
import { rankRbiTargets } from "../services/intelligence/rbiEnvironmentEngine";
import { scoreRunEnvironment } from "../services/intelligence/runEnvironmentEngine";

async function gamesForDate(date?: string) {
  return date ? getScheduleByDate(date) : getTodayGames();
}

export function registerMlbRoutes(app: Express): void {
  app.get("/api/mlb/games/today", async (_req: Request, res: Response) => {
    res.json({ date: todayISO(), games: await getTodayGames() });
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
    res.json(await buildDailyReport((req.query.date as string) || undefined));
  });

  app.get("/api/mlb/reports/vulnerable-pitchers", async (req: Request, res: Response) => {
    res.json({ report: buildVulnerablePitcherReport(await gamesForDate(req.query.date as string)) });
  });

  app.get("/api/mlb/reports/hr-targets", async (req: Request, res: Response) => {
    res.json({ targets: rankHrTargets(await gamesForDate(req.query.date as string)) });
  });

  app.get("/api/mlb/reports/sneaky-hr", async (req: Request, res: Response) => {
    res.json({ sneaky: findSneakyHrTargets(await gamesForDate(req.query.date as string)) });
  });

  app.get("/api/mlb/reports/rbi-targets", async (req: Request, res: Response) => {
    res.json(rankRbiTargets(await gamesForDate(req.query.date as string)));
  });

  app.get("/api/mlb/reports/run-environments", async (req: Request, res: Response) => {
    res.json({ environments: scoreRunEnvironment(await gamesForDate(req.query.date as string)) });
  });
}
