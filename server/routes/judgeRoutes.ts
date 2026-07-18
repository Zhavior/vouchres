/** AI judge routes — review picks / parlays / bias / brand mark. */
import type { Express, Response } from "express";
import { AppError } from "../errors/AppError";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import type { RequestWithContext } from "../middleware/requestContext";
import { runJudgePanel } from "../services/judging/trustJudgeService";
import { judgeBias } from "../services/judging/biasJudgeService";
import { judgeRepoBrandMark } from "../services/judging/brandMarkJudgeService";
import { PickCandidate } from "../services/judging/judgeTypes";
import { gradingLimiter } from "../middleware/rateLimit";
import { requireAuth } from "../middleware/auth";

export function registerJudgeRoutes(app: Express): void {
  /** Brand-mark QA panel — scores the shipping VE icon (no auth; static asset review). */
  app.get("/api/judge/brand-mark", gradingLimiter, asyncHandler(async (req: RequestWithContext, res: Response) => {
    return res.json(apiOkFlat(req, { verdict: judgeRepoBrandMark() }));
  }));

  app.post("/api/judge/pick", requireAuth, gradingLimiter, asyncHandler(async (req: RequestWithContext, res: Response) => {
    const pick = req.body?.pick as PickCandidate;
    if (!pick) {
      throw new AppError({
        status: 400,
        code: "validation_error",
        message: "pick is required.",
        details: [{ path: "pick", message: "Required." }],
      });
    }
    return res.json(apiOkFlat(req, { verdict: runJudgePanel(pick) }));
  }));

  app.post("/api/judge/parlay", requireAuth, gradingLimiter, asyncHandler(async (req: RequestWithContext, res: Response) => {
    const pick = (req.body?.pick ?? {}) as PickCandidate;
    return res.json(apiOkFlat(req, {
      verdict: runJudgePanel({ ...pick, isParlay: true, legs: pick.legs ?? req.body?.legs ?? 3 }),
    }));
  }));

  app.post("/api/judge/bias", requireAuth, gradingLimiter, asyncHandler(async (req: RequestWithContext, res: Response) => {
    const pick = req.body?.pick as PickCandidate;
    if (!pick) {
      throw new AppError({
        status: 400,
        code: "validation_error",
        message: "pick is required.",
        details: [{ path: "pick", message: "Required." }],
      });
    }
    return res.json(apiOkFlat(req, { result: judgeBias(pick) }));
  }));
}
