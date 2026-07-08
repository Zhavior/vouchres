/** AI explanation / daily report / learning note routes (Gemini backend-only). */
import type { Express, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { asyncHandler } from "../lib/asyncHandler";
import { generateAiChatResponse } from "../services/ai/chatService";
import { generateAiImage } from "../services/ai/imageGenerationService";
import { generateAiTheme } from "../services/ai/themeGenerationService";
import { generatePlayerResearch } from "../services/ai/playerResearchService";
import { explainPick } from "../services/ai/pickExplanationService";
import { getDailyReportNarrative } from "../services/ai/dailyReportService";
import { generateLearningNote } from "../services/ai/learningNoteService";
import { assertParlayEdgeReportIsSafe, generateParlayEdgeReport } from "../services/ai/parlayEdgeReportService";
import { PickCandidate } from "../services/judging/judgeTypes";
import { requireAuth } from "../middleware/auth";
import { generationLimiter } from "../middleware/rateLimit";
import { validate } from "../middleware/validation";
import {
  AiChatRequestSchema,
  AiImageRequestSchema,
  AiThemeRequestSchema,
  ParlayEdgeRequestSchema,
  PlayerResearchRequestSchema,
  type AiChatInput,
  type AiImageInput,
  type AiThemeInput,
  type ParlayEdgeInput,
  type PlayerResearchInput,
} from "../validators/aiSchemas";

export function registerAiRoutes(app: Express): void {
  app.post(
    "/api/ai/chat",
    requireAuth,
    generationLimiter,
    validate({ body: AiChatRequestSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await generateAiChatResponse(req.body as AiChatInput);
      return res.json({ ok: true, ...result });
    })
  );

  app.post(
    "/api/ai/generate-image",
    requireAuth,
    generationLimiter,
    validate({ body: AiImageRequestSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await generateAiImage(req.body as AiImageInput);
      return res.json({ ok: true, ...result });
    })
  );

  app.post(
    "/api/ai/generate-theme",
    requireAuth,
    generationLimiter,
    validate({ body: AiThemeRequestSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await generateAiTheme(req.body as AiThemeInput);
      return res.json({ ok: true, ...result });
    })
  );

  app.post(
    "/api/ai/player-research",
    requireAuth,
    generationLimiter,
    validate({ body: PlayerResearchRequestSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await generatePlayerResearch(req.body as PlayerResearchInput);
      return res.json({ ok: true, ...result });
    })
  );

  app.post("/api/ai/explain-pick", requireAuth, generationLimiter, asyncHandler(async (req: Request, res: Response) => {
    const pick = req.body?.pick as PickCandidate;
    if (!pick) {
      throw new AppError({
        status: 400,
        code: "validation_error",
        message: "pick is required.",
        details: [{ path: "pick", message: "Required." }],
      });
    }
    res.json({ ok: true, ...(await explainPick(pick)) });
  }));

  app.post("/api/ai/daily-report", requireAuth, generationLimiter, asyncHandler(async (req: Request, res: Response) => {
    res.json({ ok: true, ...(await getDailyReportNarrative(req.body?.date)) });
  }));

  app.post("/api/ai/learning-note", requireAuth, generationLimiter, asyncHandler(async (req: Request, res: Response) => {
    const { pickId, result, originalLogic, whatActuallyHappened } = req.body ?? {};
    if (!pickId || !result) {
      throw new AppError({
        status: 400,
        code: "validation_error",
        message: "pickId and result are required.",
        details: [
          ...(!pickId ? [{ path: "pickId", message: "Required." }] : []),
          ...(!result ? [{ path: "result", message: "Required." }] : []),
        ],
      });
    }
    res.json({
      ok: true,
      ...(await generateLearningNote({ pickId, result, originalLogic: originalLogic ?? "", whatActuallyHappened })),
    });
  }));

  app.post(
    "/api/ai/parlay-edge",
    requireAuth,
    generationLimiter,
    validate({ body: ParlayEdgeRequestSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await generateParlayEdgeReport(req.body as ParlayEdgeInput);
      assertParlayEdgeReportIsSafe(result.report);
      return res.json({ ok: true, ...result });
    })
  );
}
