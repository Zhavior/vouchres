import type { Express, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth, requireStaff } from "../middleware/auth";
import { generationLimiter } from "../middleware/rateLimit";
import {
  generateHrSocialDrafts,
  listDrafts,
  listJudges,
  mockPostDraft,
  queueDraft,
} from "../services/aiJudges/socialDraftService";

export function registerAiJudgeSocialRoutes(app: Express): void {
  app.get("/api/ai-judge-social/judges", asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      ok: true,
      status: "ready",
      mode: "safe_prototype",
      judges: listJudges(),
    });
  }));

  app.post(
    "/api/ai-judge-social/generate-hr-drafts",
    requireAuth,
    requireStaff,
    generationLimiter,
    asyncHandler(async (req: Request, res: Response) => {
      const result = await generateHrSocialDrafts({
        date: req.body?.date,
        scheduledFor: req.body?.scheduledFor,
      });

      res.json({
        ok: true,
        status: "ready",
        mode: "safe_prototype_no_real_x_posting",
        ...result,
      });
    }),
  );

  app.get(
    "/api/ai-judge-social/drafts",
    requireAuth,
    requireStaff,
    asyncHandler(async (_req: Request, res: Response) => {
      res.json({
        ok: true,
        status: "ready",
        mode: "safe_prototype",
        drafts: listDrafts(),
      });
    }),
  );

  app.post(
    "/api/ai-judge-social/drafts/:draftId/queue",
    requireAuth,
    requireStaff,
    generationLimiter,
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const draft = queueDraft(req.params.draftId);
        res.json({
          ok: true,
          status: "queued",
          draft,
        });
      } catch (error) {
        if (error instanceof Error && error.message === "Draft not found") {
          throw new AppError({ status: 404, code: "not_found", message: error.message });
        }
        throw error;
      }
    }),
  );

  app.post(
    "/api/ai-judge-social/drafts/:draftId/mock-post",
    requireAuth,
    requireStaff,
    generationLimiter,
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const draft = mockPostDraft(req.params.draftId);
        res.json({
          ok: true,
          status: "mock_posted",
          message: "Safe prototype only. Nothing was posted to X/Twitter.",
          draft,
        });
      } catch (error) {
        if (error instanceof Error && error.message === "Draft not found") {
          throw new AppError({ status: 404, code: "not_found", message: error.message });
        }
        throw error;
      }
    }),
  );
}
