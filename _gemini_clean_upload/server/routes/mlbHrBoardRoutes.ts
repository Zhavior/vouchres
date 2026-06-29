/**
 * HR Board Routes — Validated Pipeline
 *
 * Uses the new hrPipeline.ts which:
 *   - Fetches only today's teams (not all 30)
 *   - Builds a Today Player Pool (top 13 playable hitters per team)
 *   - Validates each candidate (15 checks including injury/lineup/team/game)
 *   - Scores only validated candidates
 *   - Returns dataConfidence + status + warnings on every candidate
 *
 * Endpoints:
 *   GET /api/mlb/hr-board/today        → Validated HR candidates + pool summary
 *   GET /api/mlb/hr-board/today/pool   → Today Player Pool summary
 *   GET /api/mlb/hr-board/today/debug  → Debug info (blocked reasons, counts, warnings)
 *   GET /api/mlb/hr-board/date/:date   → Same but for a specific date
 *   GET /api/mlb/hr-board/player/:id   → Single player detail
 */
import type { Express, Request, Response } from "express";
import { buildValidatedHrBoard } from "../services/mlb/hrPipeline";
import { buildHrBoard, getHrBoardPlayer } from "../services/mlb/dailyHrBoardService";
import { getTodayHomeRuns } from "../services/mlb/hrFeedService";
import { buildHrBoardApiPayload } from "../services/mlb/hrBoardResponse";

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

  /* ============ MAIN: Validated HR Board ============ */
  app.get("/api/mlb/hr-board/today", async (req: Request, res: Response) => {
    try {
      const result = await buildValidatedHrBoard();
      res.json(buildHrBoardApiPayload(result, req.query.previewLimit));
    } catch (err: any) {
      console.error("[hr-board/today] validated pipeline failed:", err.message);
      res.status(503).json({
        error: "HR board unavailable",
        message: err?.message,
      });
    }
  });

  /* ============ Today Player Pool ============ */
  app.get("/api/mlb/hr-board/today/pool", async (_req: Request, res: Response) => {
    try {
      const result = await buildValidatedHrBoard();
      res.json(result.pool);
    } catch (err: any) {
      res.status(503).json({ error: "Pool unavailable", message: err?.message });
    }
  });

  /* ============ Debug endpoint ============ */
  app.get("/api/mlb/hr-board/today/debug", async (_req: Request, res: Response) => {
    try {
      const result = await buildValidatedHrBoard();
      res.json(result.debug);
    } catch (err: any) {
      res.status(503).json({ error: "Debug unavailable", message: err?.message });
    }
  });

  /* ============ Deep endpoint (old full board — slow, use sparingly) ============ */
  app.get("/api/mlb/hr-board/today/deep", async (_req: Request, res: Response) => {
    try {
      const result = await Promise.race([
        buildHrBoard(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Deep board timed out after 20s")), 20000)
        ),
      ]);
      res.json(result);
    } catch (err: any) {
      res.status(503).json({
        error: "Deep HR board unavailable",
        message: err?.message,
        hint: "Use /api/mlb/hr-board/today for the fast validated board.",
      });
    }
  });

  app.get("/api/mlb/hr-board/date/:date", async (req: Request, res: Response) => {
    try {
      const result = await buildValidatedHrBoard(req.params.date);
      res.json(buildHrBoardApiPayload(result, req.query.previewLimit));
    } catch (err: any) {
      res.status(503).json({ error: "HR board unavailable", message: err?.message });
    }
  });

  app.get("/api/mlb/hr-board/player/:playerId", async (req: Request, res: Response) => {
    try {
      const date = (req.query.date as string) || undefined;
      const result = await buildValidatedHrBoard(date);
      const candidate = result.candidates.find(
        (c) => String(c.playerId) === String(req.params.playerId)
      );
      if (!candidate) {
        return res.status(404).json({ error: "Player not found in validated candidates" });
      }
      res.json({ player: candidate });
    } catch (err: any) {
      res.status(503).json({ error: "Player lookup unavailable", message: err?.message });
    }
  });
}
