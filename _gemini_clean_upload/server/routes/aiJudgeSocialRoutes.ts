import type { Express, Request, Response } from "express";
import {
  generateHrSocialDrafts,
  listDrafts,
  listJudges,
  mockPostDraft,
  queueDraft,
} from "../services/aiJudges/socialDraftService";

export function registerAiJudgeSocialRoutes(app: Express): void {
  app.get("/api/ai-judge-social/judges", (_req: Request, res: Response) => {
    res.json({
      status: "ready",
      mode: "safe_prototype",
      judges: listJudges(),
    });
  });

  app.post("/api/ai-judge-social/generate-hr-drafts", async (req: Request, res: Response) => {
    try {
      const result = await generateHrSocialDrafts({
        date: req.body?.date,
        scheduledFor: req.body?.scheduledFor,
      });

      res.json({
        status: "ready",
        mode: "safe_prototype_no_real_x_posting",
        ...result,
      });
    } catch (err: any) {
      console.error("[aiJudgeSocialRoutes] generate drafts failed:", err?.message);
      res.status(503).json({
        status: "error",
        error: "Failed to generate AI judge social drafts",
        message: err?.message,
      });
    }
  });

  app.get("/api/ai-judge-social/drafts", (_req: Request, res: Response) => {
    res.json({
      status: "ready",
      mode: "safe_prototype",
      drafts: listDrafts(),
    });
  });

  app.post("/api/ai-judge-social/drafts/:draftId/queue", (req: Request, res: Response) => {
    try {
      res.json({
        status: "queued",
        draft: queueDraft(req.params.draftId),
      });
    } catch (err: any) {
      res.status(404).json({ status: "error", message: err?.message });
    }
  });

  app.post("/api/ai-judge-social/drafts/:draftId/mock-post", (req: Request, res: Response) => {
    try {
      res.json({
        status: "mock_posted",
        message: "Safe prototype only. Nothing was posted to X/Twitter.",
        draft: mockPostDraft(req.params.draftId),
      });
    } catch (err: any) {
      res.status(404).json({ status: "error", message: err?.message });
    }
  });
}
