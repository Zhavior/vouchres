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
import { buildSlateResults } from "../services/results/slateResultsService";
import { buildAuditSummary } from "../services/results/auditSummaryService";
import {
  deleteCapperPick,
  listActiveCappers,
  requireSlateDate,
  upsertCapperPicks,
} from "../services/cappers/cappersService";

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
  /**
   * Graded record of one MLB slate — the Results desk.
   *
   * Public read: nothing here is user-scoped, and every number is derived from
   * the real HR feed plus pregame captures, so there is no private state to leak.
   */
  app.get("/api/results/slate/:date", asyncHandler(async (req: ResultReq, res: Response) => {
    const date = requireSlateDate(req.params.date);
    const results = await buildSlateResults(date);
    return res.json(apiOkFlat(req, { ...results }));
  }));

  /**
   * Audited track record for the public landing.
   *
   * Public read: it reports counts and hashes over the pregame ledger, never
   * the feature vectors themselves.
   */
  app.get("/api/results/audit-summary", asyncHandler(async (req: ResultReq, res: Response) => {
    const summary = await buildAuditSummary();
    return res.json(apiOkFlat(req, { ...summary }));
  }));

  /** The tracked handles, for pick entry and for rendering an empty desk. */
  app.get("/api/results/cappers", asyncHandler(async (req: ResultReq, res: Response) => {
    const cappers = await listActiveCappers();
    return res.json(apiOkFlat(req, {
      cappers: cappers.map((capper) => ({
        id: capper.id,
        handle: capper.handle,
        displayName: capper.display_name,
        avatarUrl: capper.avatar_url,
      })),
    }));
  }));

  /**
   * Record picks for a slate. Staff-only: a capper's call is a claim about what
   * someone else published, so it is never writable by the account reading it.
   */
  app.post("/api/results/cappers/picks", requireAuth, requireStaff, gradingLimiter, asyncHandler(async (req: ResultReq, res: Response) => {
    const body = (req.body ?? {}) as { picks?: unknown };
    const picks = Array.isArray(body.picks) ? body.picks : [];
    const saved = await upsertCapperPicks(picks as never[]);
    return res.status(201).json(apiOkFlat(req, { saved: saved.length }));
  }));

  app.delete("/api/results/cappers/picks/:id", requireAuth, requireStaff, asyncHandler(async (req: ResultReq, res: Response) => {
    await deleteCapperPick(req.params.id);
    return res.json(apiOkFlat(req, { deleted: true }));
  }));

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
