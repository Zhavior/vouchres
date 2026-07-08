/** AI judge routes — review picks / parlays / bias. */
import type { Express, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { asyncHandler } from "../lib/asyncHandler";
import { runJudgePanel } from "../services/judging/trustJudgeService";
import { judgeBias } from "../services/judging/biasJudgeService";
import { PickCandidate } from "../services/judging/judgeTypes";
import { gradingLimiter } from "../middleware/rateLimit";
import { requireAuth } from "../middleware/auth";

export function registerJudgeRoutes(app: Express): void {
  app.post("/api/judge/pick", requireAuth, gradingLimiter, asyncHandler(async (req: Request, res: Response) => {
    const pick = req.body?.pick as PickCandidate;
    if (!pick) {
      throw new AppError({
        status: 400,
        code: "validation_error",
        message: "pick is required.",
        details: [{ path: "pick", message: "Required." }],
      });
    }
    return res.json({ ok: true, verdict: runJudgePanel(pick) });
  }));

  app.post("/api/judge/parlay", requireAuth, gradingLimiter, asyncHandler(async (req: Request, res: Response) => {
    const pick = (req.body?.pick ?? {}) as PickCandidate;
    return res.json({
      ok: true,
      verdict: runJudgePanel({ ...pick, isParlay: true, legs: pick.legs ?? req.body?.legs ?? 3 }),
    });
  }));

  app.post("/api/judge/bias", requireAuth, gradingLimiter, asyncHandler(async (req: Request, res: Response) => {
    const pick = req.body?.pick as PickCandidate;
    if (!pick) {
      throw new AppError({
        status: 400,
        code: "validation_error",
        message: "pick is required.",
        details: [{ path: "pick", message: "Required." }],
      });
    }
    return res.json({ ok: true, result: judgeBias(pick) });
  }));
}
