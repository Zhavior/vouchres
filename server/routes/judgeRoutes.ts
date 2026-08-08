/** AI judge routes — review picks / parlays / bias. */
import type { Express, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import type { RequestWithContext } from "../middleware/requestContext";
import { runJudgePanel } from "../services/judging/trustJudgeService";
import { judgeBias } from "../services/judging/biasJudgeService";
import { PickCandidate } from "../services/judging/judgeTypes";
import { gradingLimiter } from "../middleware/rateLimit";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { JudgeParlayRequestSchema, JudgePickRequestSchema } from "../validators/aiSchemas";

export function registerJudgeRoutes(app: Express): void {
  app.post("/api/judge/pick", requireAuth, gradingLimiter, validate({ body: JudgePickRequestSchema }), asyncHandler(async (req: RequestWithContext, res: Response) => {
    const pick = req.body?.pick as PickCandidate;
    return res.json(apiOkFlat(req, { verdict: runJudgePanel(pick) }));
  }));

  app.post("/api/judge/parlay", requireAuth, gradingLimiter, validate({ body: JudgeParlayRequestSchema }), asyncHandler(async (req: RequestWithContext, res: Response) => {
    const pick = (req.body?.pick ?? {}) as PickCandidate;
    return res.json(apiOkFlat(req, {
      verdict: runJudgePanel({ ...pick, isParlay: true, legs: pick.legs ?? req.body?.legs ?? 3 }),
    }));
  }));

  app.post("/api/judge/bias", requireAuth, gradingLimiter, validate({ body: JudgePickRequestSchema }), asyncHandler(async (req: RequestWithContext, res: Response) => {
    const pick = req.body?.pick as PickCandidate;
    return res.json(apiOkFlat(req, { result: judgeBias(pick) }));
  }));
}
