/** AI explanation / daily report / learning note routes (Gemini backend-only). */
import type { Express, Response } from "express";
import { AppError } from "../errors/AppError";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import type { AuthedRequest } from "../middleware/auth";
import type { RequestWithContext } from "../middleware/requestContext";
import { requireTierOrQuota, incrementQuota } from "../middleware/entitlements";
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

type AiReq = AuthedRequest & RequestWithContext;

async function incrementAiQuotaIfNeeded(req: AiReq): Promise<void> {
  const q = (req as { __quota?: { key: string; day: string } }).__quota;
  if (q) {
    await incrementQuota(req.user!.id, q.key, q.day);
  }
}

export function registerAiRoutes(app: Express): void {
  app.post(
    "/api/ai/chat",
    requireAuth,
    generationLimiter,
    requireTierOrQuota("gold", 20, "ai_chat", 500),
    validate({ body: AiChatRequestSchema }),
    asyncHandler(async (req: AiReq, res: Response) => {
      const result = await generateAiChatResponse(req.body as AiChatInput);
      await incrementAiQuotaIfNeeded(req);
      return res.json(apiOkFlat(req, result as unknown as Record<string, unknown>));
    })
  );

  app.post(
    "/api/ai/generate-image",
    requireAuth,
    generationLimiter,
    requireTierOrQuota("gold", 5, "ai_image", 100),
    validate({ body: AiImageRequestSchema }),
    asyncHandler(async (req: AiReq, res: Response) => {
      const result = await generateAiImage(req.body as AiImageInput);
      await incrementAiQuotaIfNeeded(req);
      return res.json(apiOkFlat(req, result as unknown as Record<string, unknown>));
    })
  );

  app.post(
    "/api/ai/generate-theme",
    requireAuth,
    generationLimiter,
    requireTierOrQuota("gold", 5, "ai_theme", 100),
    validate({ body: AiThemeRequestSchema }),
    asyncHandler(async (req: AiReq, res: Response) => {
      const result = await generateAiTheme(req.body as AiThemeInput);
      await incrementAiQuotaIfNeeded(req);
      return res.json(apiOkFlat(req, result as unknown as Record<string, unknown>));
    })
  );

  app.post(
    "/api/ai/player-research",
    requireAuth,
    generationLimiter,
    requireTierOrQuota("gold", 15, "research_lookups", 500),
    validate({ body: PlayerResearchRequestSchema }),
    asyncHandler(async (req: AiReq, res: Response) => {
      const result = await generatePlayerResearch(req.body as PlayerResearchInput);
      await incrementAiQuotaIfNeeded(req);
      return res.json(apiOkFlat(req, result as unknown as Record<string, unknown>));
    })
  );

  app.post(
    "/api/ai/explain-pick",
    requireAuth,
    generationLimiter,
    requireTierOrQuota("gold", 10, "ai_explain", 300),
    asyncHandler(async (req: AiReq, res: Response) => {
      const pick = req.body?.pick as PickCandidate;
      if (!pick) {
        throw new AppError({
          status: 400,
          code: "validation_error",
          message: "pick is required.",
          details: [{ path: "pick", message: "Required." }],
        });
      }
      const result = await explainPick(pick);
      await incrementAiQuotaIfNeeded(req);
      return res.json(apiOkFlat(req, result as unknown as Record<string, unknown>));
    })
  );

  app.post(
    "/api/ai/daily-report",
    requireAuth,
    generationLimiter,
    requireTierOrQuota("gold", 1, "ai_daily_report", 30),
    asyncHandler(async (req: AiReq, res: Response) => {
      const result = await getDailyReportNarrative(req.body?.date);
      await incrementAiQuotaIfNeeded(req);
      return res.json(apiOkFlat(req, result as unknown as Record<string, unknown>));
    })
  );

  app.post(
    "/api/ai/learning-note",
    requireAuth,
    generationLimiter,
    requireTierOrQuota("gold", 5, "ai_learning_note", 200),
    asyncHandler(async (req: AiReq, res: Response) => {
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
      const note = await generateLearningNote({ pickId, result, originalLogic: originalLogic ?? "", whatActuallyHappened });
      await incrementAiQuotaIfNeeded(req);
      return res.json(apiOkFlat(req, note as unknown as Record<string, unknown>));
    })
  );

  app.post(
    "/api/ai/parlay-edge",
    requireAuth,
    generationLimiter,
    requireTierOrQuota("gold", 10, "parlay_edge", 300),
    validate({ body: ParlayEdgeRequestSchema }),
    asyncHandler(async (req: AiReq, res: Response) => {
      const result = await generateParlayEdgeReport(req.body as ParlayEdgeInput);
      assertParlayEdgeReportIsSafe(result.report);
      await incrementAiQuotaIfNeeded(req);
      return res.json(apiOkFlat(req, result as unknown as Record<string, unknown>));
    })
  );
}
