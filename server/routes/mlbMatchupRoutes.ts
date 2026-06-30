/** Premium Live Games matchup routes. */
import type { Express, Request, Response } from "express";
import { getGameMatchups, getGameMatchup, getLiveMatchupMatrix, getMatchupMatrix } from "../services/mlb/gameMatchupService";
import { getPitcherMatchup } from "../services/mlb/pitcherMatchupService";
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

  app.get("/api/mlb/matchup-matrix", async (req: Request, res: Response) => {
    try {
      const requestedDate = typeof req.query.date === "string" ? req.query.date : todayISO();
      const date = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : todayISO();
      const matrix = await getMatchupMatrix(date);
      res.json(matrix);
    } catch (err: any) {
      console.error("[matchup-matrix] failed:", err?.message);
      res.status(500).json({ error: "matchup_matrix_fetch_failed" });
    }
  });

  app.get("/api/mlb/matchup-matrix/live", async (req: Request, res: Response) => {
    try {
      const requestedDate = typeof req.query.date === "string" ? req.query.date : todayISO();
      const date = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : todayISO();
      const matrix = await getLiveMatchupMatrix(date);
      res.json(matrix);
    } catch (err: any) {
      console.error("[matchup-matrix/live] failed:", err?.message);
      res.status(500).json({ error: "matchup_matrix_live_fetch_failed" });
    }
  });

  app.get("/api/mlb/matchup/:gamePk", async (req: Request, res: Response) => {
    const m = await getGameMatchup(Number(req.params.gamePk), (req.query.date as string) || undefined);
    if (!m) return res.status(404).json({ error: "Matchup not found" });
    res.json({ matchup: m });
  });

  /** Pro Pitcher Matchup Drawer — pitcher card + opponent lineup with BvP. */
  app.get("/api/mlb/matchup-matrix/:gamePk/pitcher/:pitcherId", async (req: Request, res: Response) => {
    try {
      const gamePk = Number(req.params.gamePk);
      const pitcherId = Number(req.params.pitcherId);
      if (!Number.isFinite(gamePk) || !Number.isFinite(pitcherId)) {
        return res.status(400).json({ error: "invalid_ids" });
      }
      const date = typeof req.query.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
        ? req.query.date
        : undefined;
      const result = await getPitcherMatchup(gamePk, pitcherId, date);
      if (!result) return res.status(404).json({ error: "pitcher_matchup_not_found" });
      res.json(result);
    } catch (err: any) {
      console.error("[matchup-matrix/pitcher] failed:", err?.message);
      res.status(500).json({ error: "pitcher_matchup_fetch_failed" });
    }
  });
}
