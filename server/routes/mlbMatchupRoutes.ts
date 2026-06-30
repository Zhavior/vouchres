/** Premium Live Games matchup routes. */
import type { Express, Request, Response } from "express";
import { getGameMatchups, getGameMatchup } from "../services/mlb/gameMatchupService";
import { getScheduleByDate, todayISO } from "../services/mlb/mlbClient";
import { TTLCache } from "../lib/cache";

const scoresCache = new TTLCache<unknown>(45_000);

export function registerMatchupRoutes(app: Express): void {
  /** Lightweight live scores — schedule + linescore only, no roster work. 45s TTL. */
  app.get("/api/mlb/scores/today", async (_req: Request, res: Response) => {
    try {
      const date = todayISO();
      const scores = await scoresCache.getOrSet(`scores:${date}`, async () => {
        const games = await getScheduleByDate(date);
        return games.map((g) => ({
          gamePk: g.gamePk,
          status: g.status,
          isLive: /progress|live|in play|warmup/i.test(g.status),
          isFinal: /final|game over|completed/i.test(g.status),
          inning: g.inning ?? null,
          inningState: g.linescore?.inningState ?? null,
          score: g.score,
        }));
      }, 45_000);
      res.json({ scores, updatedAt: new Date().toISOString() });
    } catch (err: any) {
      console.error("[scores/today] failed:", err?.message);
      res.status(500).json({ error: "scores_fetch_failed" });
    }
  });

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
