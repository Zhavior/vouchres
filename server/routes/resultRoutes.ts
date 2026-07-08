/** Result ledger + grading routes. */
import type { Express, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { asyncHandler } from "../lib/asyncHandler";
import { boundedInt, upstreamUnavailable } from "../lib/requestValidators";
import { getLedger } from "../services/persistence/pickService";
import { gradeAndLearn } from "../services/results/learningNoteService";
import { requireAuth, requireStaff } from "../middleware/auth";
import type { AuthedRequest } from "../middleware/auth";
import { gradingLimiter } from "../middleware/rateLimit";

export function registerResultRoutes(app: Express): void {
  app.get("/api/results/ledger", requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const authedReq = req as AuthedRequest;
    const capperId = req.query.capperId as string | undefined;
    const limit = boundedInt(req.query.limit, "limit", 100, 1, 200);
    const offset = boundedInt(req.query.offset, "offset", 0, 0, 100000);
    try {
      if (capperId) {
        if (!authedReq.user?.profile.is_staff) {
          throw new AppError({ status: 403, code: "forbidden", message: "Staff access is required." });
        }
        const out = await getLedger({ capperId, limit, offset });
        return res.json({ scope: "staff_capper", picks: out.picks, total: out.total, warnings: [] });
      }
      const out = await getLedger({ userId: authedReq.user!.id, limit, offset });
      return res.json({ scope: "current_user", picks: out.picks, total: out.total, warnings: [] });
    } catch (err: any) {
      console.error("[results] ledger failed", err?.message);
      if (err instanceof AppError) throw err;
      throw upstreamUnavailable("Ledger unavailable.", err);
    }
  }));

  app.post("/api/results/grade", requireAuth, requireStaff, gradingLimiter, asyncHandler(async (req: Request, res: Response) => {
    const { pickId, result, whatActuallyHappened } = req.body ?? {};
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
    const out = await gradeAndLearn(pickId, result, whatActuallyHappened);
    if (!out.pick) throw new AppError({ status: 404, code: "not_found", message: "Pick not found." });
    res.json(out);
  }));
}
