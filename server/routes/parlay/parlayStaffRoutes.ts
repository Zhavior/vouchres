import { Router } from "express";
import type { Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { apiOkFlat } from "../../lib/apiResponse";
import { structuredLog } from "../../lib/structuredLog";
import { boundedInt, optionalYmd } from "../../lib/requestValidators";
import type { RequestWithContext } from "../../middleware/requestContext";
import { AuthedRequest, getSupabaseAdmin, requireAuth, requireStaff } from "../../middleware/auth";
import { gradingLimiter } from "../../middleware/rateLimit";
import { gradePendingPicks } from "../../services/grading/gradingService";
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

  structuredLog({
    level: "info",
    event: "parlays_grade_due",
    requestId,
    mode: "grade_due",
    days,
    userId: req.user?.id ?? null,
    gradedParlays: settled.length,
    gradedLegs: result.graded.length,
    pendingLegs: pending.length,
    errorCount: errors.length,
  });

  try {
    const logRows = [
      ...settled.map((row) => ({ pick_id: row.pick_id, status: row.status, reason: "graded", source: "grade-due" })),
      ...pending.map((row) => ({ pick_id: row.pick_id, status: "pending", reason: "pending_not_final", source: "grade-due" })),
      ...errors.map((row) => ({ pick_id: row.pick_id, status: "graded_error", reason: row.error ?? "error", source: "grade-due" })),
    ];
    if (logRows.length > 0) {
      const supabaseAdmin = await getSupabaseAdmin();
      const { error: logErr } = await supabaseAdmin.from("grading_logs").insert(logRows);
      if (logErr && !["42P01", "PGRST205"].includes(logErr.code)) {
        console.warn("[parlays/grade-due] grading_logs write failed", JSON.stringify({
          requestId,
          code: logErr.code,
          message: logErr.message,
        }));
      }
    }
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
