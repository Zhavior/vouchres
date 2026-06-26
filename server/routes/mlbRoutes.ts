/** MLB data + intelligence report routes. */
import type { Express, Request, Response } from "express";
import { getTodayGames, getScheduleByDate, getGameFeed, getProbablePitchers, todayISO } from "../services/mlb/mlbClient";
import { getSharedDailyReport } from "../services/intelligence/mlbIntelligenceEngine";

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
