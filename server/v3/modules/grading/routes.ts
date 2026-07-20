import type { Response } from "express";
import { Router } from "express";
import { AppError } from "../../../errors/AppError";
import { asyncHandler } from "../../../lib/asyncHandler";
import { apiOkFlat } from "../../../lib/apiResponse";
import { boolQuery, boundedInt, optionalYmd } from "../../../lib/requestValidators";
import { requireAuth, requireStaff } from "../../../middleware/auth";
import type { AuthedRequest } from "../../../middleware/auth";
import type { RequestWithContext } from "../../../middleware/requestContext";
import { gradingLimiter } from "../../../middleware/rateLimit";
import { getLedger } from "../../../services/persistence/pickService";
import { gradePendingPicks } from "../../../services/grading/gradingService";
import { buildGradeDueLogRows, persistGradingRunLogs } from "../../../services/grading/gradingLogService";
import { previewLiveHrParlayMatches } from "../../../services/grading/liveHrParlayService";
import { applyLiveHrParlayMatches } from "../../../services/grading/liveHrParlayWriteService";
import { partitionGradeDueResult } from "../../../routes/parlay/parlayGradingResponses";
import { repairLegacyParlayIdentityForSync } from "../../../routes/parlay/parlayRepairHelpers";

type V3AuthedRequest = AuthedRequest & RequestWithContext;

export const v3GradingRoutes = Router();

v3GradingRoutes.get(
  "/ledger",
  requireAuth,
  asyncHandler(async (req: V3AuthedRequest, res: Response) => {
    const capperId = req.query.capperId as string | undefined;
    const limit = boundedInt(req.query.limit, "limit", 100, 1, 200);
    const offset = boundedInt(req.query.offset, "offset", 0, 0, 100000);

    if (capperId) {
      if (!req.user?.profile.is_staff) {
        throw new AppError({ status: 403, code: "forbidden", message: "Staff access is required." });
      }
      const out = await getLedger({ capperId, limit, offset });
      return res.json(apiOkFlat(req, {
        version: "v3",
        scope: "staff_capper",
        picks: out.picks,
        total: out.total,
        warnings: [],
      }));
    }

    const out = await getLedger({ userId: req.user!.id, limit, offset });
    return res.json(apiOkFlat(req, {
      version: "v3",
      scope: "current_user",
      picks: out.picks,
      total: out.total,
      warnings: [],
    }));
  }),
);

v3GradingRoutes.post(
  "/grade-due",
  requireAuth,
  requireStaff,
  gradingLimiter,
  asyncHandler(async (req: V3AuthedRequest, res: Response) => {
    const rawDays = (req.body as { days?: number | string } | undefined)?.days ?? req.query.days;
    const days = boundedInt(rawDays, "days", 2, 1, 7);
    const result = await gradePendingPicks({ days });
    const { settled, pending, errors, summary } = partitionGradeDueResult(result);
    const requestId = req.requestId ?? "unknown";

    console.log("[v3/grading/grade-due]", JSON.stringify({
      requestId,
      mode: "grade_due",
      days,
      userId: req.user?.id ?? null,
      gradedParlays: settled.length,
      gradedLegs: result.graded.length,
      pendingLegs: pending.length,
      errorCount: errors.length,
    }));

    try {
      const logRows = buildGradeDueLogRows({ settled, pending, errors, source: "v3_grade_due" });
      await persistGradingRunLogs(logRows);
    } catch (logErr: any) {
      console.warn("[v3/grading/grade-due] grading_logs unavailable", JSON.stringify({
        requestId,
        code: logErr?.code ?? null,
        message: logErr instanceof Error ? logErr.message : String(logErr),
      }));
    }

    return res.json(apiOkFlat(req, {
      version: "v3",
      mode: "grade_due",
      gradedParlays: settled.length,
      gradedLegs: result.graded.length,
      pendingLegs: pending.length,
      summary,
      warnings: summary.warnings,
      errors: errors.map((row) => ({ pick_id: row.pick_id, error: row.error })),
      checkedAt: new Date().toISOString(),
    }));
  }),
);

v3GradingRoutes.post(
  "/repair-identity",
  requireAuth,
  requireStaff,
  gradingLimiter,
  asyncHandler(async (req: V3AuthedRequest, res: Response) => {
    const dryRun = boolQuery((req.body as { dryRun?: boolean } | undefined)?.dryRun ?? req.query.dryRun, false);
    const limit = boundedInt((req.body as { limit?: number } | undefined)?.limit ?? req.query.limit, "limit", 100, 1, 250);
    const result = await repairLegacyParlayIdentityForSync({
      dryRun,
      limit,
      externalProvider: "v3_staff_repair_identity",
    });

    return res.json(apiOkFlat(req, {
      version: "v3",
      mode: "repair_identity",
      ...result,
      checkedAt: new Date().toISOString(),
    }));
  }),
);

v3GradingRoutes.post(
  "/live-hr-preview",
  requireAuth,
  requireStaff,
  gradingLimiter,
  asyncHandler(async (req: V3AuthedRequest, res: Response) => {
    const rawDate = (req.body as { date?: string } | undefined)?.date ?? req.query.date;
    const date = optionalYmd(rawDate);
    const matches = await previewLiveHrParlayMatches(date);

    return res.json(apiOkFlat(req, {
      version: "v3",
      mode: "preview_only",
      date: date ?? null,
      matchCount: matches.length,
      matches,
    }));
  }),
);

v3GradingRoutes.post(
  "/live-hr-sync",
  requireAuth,
  requireStaff,
  gradingLimiter,
  asyncHandler(async (req: V3AuthedRequest, res: Response) => {
    const rawDate = (req.body as { date?: string } | undefined)?.date ?? req.query.date;
    const date = optionalYmd(rawDate);
    const repair = await repairLegacyParlayIdentityForSync({
      dryRun: false,
      limit: 100,
      externalProvider: "v3_live_hr_sync_repair",
    });
    const result = await applyLiveHrParlayMatches(date);

    return res.json(apiOkFlat(req, {
      version: "v3",
      mode: "live_hr_sync",
      date: date ?? null,
      repair,
      ...result,
    }));
  }),
);
