/** Premium Live Games matchup routes. */
import type { Express, Request, Response } from "express";
import { getGameMatchups, getGameMatchup } from "../services/mlb/gameMatchupService";

export function registerMatchupRoutes(app: Express): void {
  app.get("/api/mlb/matchups/today", async (_req: Request, res: Response) => {
    const matchups = await getGameMatchups();
    res.json({ count: matchups.length, matchups, generatedAt: new Date().toISOString() });
  });

  app.get("/api/mlb/matchups/date/:date", async (req: Request, res: Response) => {
    const matchups = await getGameMatchups(req.params.date);
    res.json({ count: matchups.length, matchups, generatedAt: new Date().toISOString() });
  });

  app.get("/api/mlb/matchup/:gamePk", async (req: Request, res: Response) => {
    const m = await getGameMatchup(Number(req.params.gamePk), (req.query.date as string) || undefined);
    if (!m) return res.status(404).json({ error: "Matchup not found" });
    res.json({ matchup: m });
  });
}
