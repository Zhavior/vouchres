/** Daily HR Board + live HR feed routes. */
import type { Express, Request, Response } from "express";
import { buildHrBoard, getHrBoardPlayer } from "../services/mlb/dailyHrBoardService";
import { getTodayHomeRuns } from "../services/mlb/hrFeedService";

export function registerHrBoardRoutes(app: Express): void {
  // Live home-run feed (real HR plays from today's games).
  app.get("/api/mlb/hr-feed/today", async (_req: Request, res: Response) => {
    const events = await getTodayHomeRuns();
    res.json({ count: events.length, events, generatedAt: new Date().toISOString() });
  });
  app.get("/api/mlb/hr-feed/date/:date", async (req: Request, res: Response) => {
    const events = await getTodayHomeRuns(req.params.date);
    res.json({ count: events.length, events, generatedAt: new Date().toISOString() });
  });

  app.get("/api/mlb/hr-board/today", async (_req: Request, res: Response) => {
    res.json(await buildHrBoard());
  });

  app.get("/api/mlb/hr-board/date/:date", async (req: Request, res: Response) => {
    res.json(await buildHrBoard(req.params.date));
  });

  app.get("/api/mlb/hr-board/player/:playerId", async (req: Request, res: Response) => {
    const date = (req.query.date as string) || undefined;
    const row = await getHrBoardPlayer(Number(req.params.playerId), date);
    if (!row) return res.status(404).json({ error: "Player not found on this board" });
    res.json({ player: row });
  });
}
