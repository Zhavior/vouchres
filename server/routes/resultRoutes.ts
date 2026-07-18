/** Result ledger + grading routes. */
import type { Express, Response } from "express";
import { AppError } from "../errors/AppError";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import { boundedInt, upstreamUnavailable } from "../lib/requestValidators";
import { getLedger, gradePick as persistGradePick } from "../services/persistence/pickService";
import { requireAuth, requireStaff } from "../middleware/auth";
import type { AuthedRequest } from "../middleware/auth";
import type { RequestWithContext } from "../middleware/requestContext";
import { gradingLimiter } from "../middleware/rateLimit";

type ResultReq = AuthedRequest & RequestWithContext;

const RESULT_STATUS_MAP: Record<string, "won" | "lost" | "push" | "void"> = {
  win: "won",
  won: "won",
  loss: "lost",
  lost: "lost",
  push: "push",
  void: "void",
};

export function registerResultRoutes(app: Express): void {
  app.get("/api/results/ledger", requireAuth, asyncHandler(async (req: ResultReq, res: Response) => {
    const capperId = req.query.capperId as string | undefined;
    const limit = boundedInt(req.query.limit, "limit", 100, 1, 200);
    const offset = boundedInt(req.query.offset, "offset", 0, 0, 100000);
    try {
      if (capperId) {
        if (!req.user?.profile.is_staff) {
          throw new AppError({ status: 403, code: "forbidden", message: "Staff access is required." });
        }
        const out = await getLedger({ capperId, limit, offset });
        return res.json(apiOkFlat(req, { scope: "staff_capper", picks: out.picks, total: out.total, warnings: [] }));
      }
      const out = await getLedger({ userId: req.user!.id, limit, offset });
      return res.json(apiOkFlat(req, { scope: "current_user", picks: out.picks, total: out.total, warnings: [] }));
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw upstreamUnavailable("Ledger unavailable.", err);
    }
  }));

  /**
   * Staff grading writes to Postgres (pending → settled).
   * The old in-memory seed ledger path is retired — it never touched real picks.
   */
  app.post("/api/results/grade", requireAuth, requireStaff, gradingLimiter, asyncHandler(async (req: ResultReq, res: Response) => {
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

    const status = RESULT_STATUS_MAP[String(result).toLowerCase()];
    if (!status) {
      throw new AppError({
        status: 400,
        code: "validation_error",
        message: "result must be one of: win, loss, push, void.",
        details: [{ path: "result", message: "Invalid result status." }],
      });
    }

    const learningNote =
      typeof whatActuallyHappened === "string" && whatActuallyHappened.trim()
        ? whatActuallyHappened.trim().slice(0, 2000)
        : undefined;

    const changed = await persistGradePick({
      pickId: String(pickId),
      status,
      settledUnits: null,
      learningNote,
    });

    if (!changed) {
      throw new AppError({
        status: 404,
        code: "not_found",
        message: "Pick not found or already graded.",
      });
    }

    return res.json(apiOkFlat(req, {
      pickId: String(pickId),
      status,
      source: "postgres",
      learningNote: learningNote ?? null,
    }));
  }));
}
