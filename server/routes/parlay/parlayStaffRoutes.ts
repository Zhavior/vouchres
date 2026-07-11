import { Router } from "express";
import type { Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { apiOkFlat } from "../../lib/apiResponse";
import { boundedInt, optionalYmd } from "../../lib/requestValidators";
import type { RequestWithContext } from "../../middleware/requestContext";
import { AuthedRequest, requireAuth, requireStaff } from "../../middleware/auth";
import { gradingLimiter } from "../../middleware/rateLimit";
import { gradePendingPicks } from "../../services/grading/gradingService";
import { buildGradeDueLogRows, persistGradingRunLogs } from "../../services/grading/gradingLogService";
import { previewLiveHrParlayMatches } from "../../services/grading/liveHrParlayService";
import { applyLiveHrParlayMatches } from "../../services/grading/liveHrParlayWriteService";
import { partitionGradeDueResult } from "./parlayGradingResponses";
import { repairLegacyParlayIdentityForSync } from "./parlayRepairHelpers";

export const parlayStaffRoutes = Router();

parlayStaffRoutes.post("/parlays/live-hr-sync", requireAuth, requireStaff, gradingLimiter, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const rawDate = (req.body as { date?: string } | undefined)?.date ?? req.query.date;
  const date = optionalYmd(rawDate);
  const repair = await repairLegacyParlayIdentityForSync({
    dryRun: false,
    limit: 100,
    externalProvider: "live_hr_sync_repair",
  });
  const result = await applyLiveHrParlayMatches(date);

  return res.json(apiOkFlat(req, {
    mode: "live_hr_sync",
    date: date ?? null,
    repair,
    ...result,
  }));
}));

parlayStaffRoutes.post("/parlays/live-hr-preview", requireAuth, requireStaff, gradingLimiter, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const rawDate = (req.body as { date?: string } | undefined)?.date ?? req.query.date;
  const date = optionalYmd(rawDate);
  const matches = await previewLiveHrParlayMatches(date);

  return res.json(apiOkFlat(req, {
    mode: "preview_only",
    date: date ?? null,
    matchCount: matches.length,
    matches,
  }));
}));

/** Staff-only: systemwide grading mutates every user's pending picks. Cron uses /cron/*. */
parlayStaffRoutes.post("/parlays/grade-due", requireAuth, requireStaff, gradingLimiter, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const rawDays = (req.body as { days?: number | string } | undefined)?.days ?? req.query.days;
  const days = boundedInt(rawDays, "days", 2, 1, 7);
  const result = await gradePendingPicks({ days });
  const { settled, pending, errors, summary } = partitionGradeDueResult(result);
  const requestId = (req as AuthedRequest & RequestWithContext).requestId ?? "unknown";

  console.log("[parlays/grade-due]", JSON.stringify({
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
    const logRows = buildGradeDueLogRows({ settled, pending, errors, source: "grade-due" });
    await persistGradingRunLogs(logRows);
  } catch (logErr: any) {
    console.warn("[parlays/grade-due] grading_logs unavailable", JSON.stringify({
      requestId,
      code: logErr?.code ?? null,
      message: logErr instanceof Error ? logErr.message : String(logErr),
    }));
  }

  return res.json(apiOkFlat(req, {
    mode: "grade_due",
    gradedParlays: settled.length,
    gradedLegs: result.graded.length,
    pendingLegs: pending.length,
    summary,
    warnings: summary.warnings,
    errors: errors.map((row) => ({ pick_id: row.pick_id, error: row.error })),
    checkedAt: new Date().toISOString(),
  }));
}));

parlayStaffRoutes.post("/parlays/repair-identity", requireAuth, requireStaff, gradingLimiter, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const dryRun = String((req.body as { dryRun?: boolean } | undefined)?.dryRun ?? req.query.dryRun ?? "false") === "true";
  const limit = boundedInt((req.body as { limit?: number } | undefined)?.limit ?? req.query.limit, "limit", 100, 1, 250);
  const result = await repairLegacyParlayIdentityForSync({
    dryRun,
    limit,
    externalProvider: "staff_repair_identity",
  });

  return res.json(apiOkFlat(req, {
    mode: "repair_identity",
    ...result,
    checkedAt: new Date().toISOString(),
  }));
}));
