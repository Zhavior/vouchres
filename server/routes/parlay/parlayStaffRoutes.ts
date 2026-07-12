import { Router } from "express";
import type { Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { apiOkFlat } from "../../lib/apiResponse";
import { boundedInt, optionalYmd } from "../../lib/requestValidators";
import type { RequestWithContext } from "../../middleware/requestContext";
import { AuthedRequest, requireAuth, requireStaff } from "../../middleware/auth";
import { gradingLimiter } from "../../middleware/rateLimit";
import { executeGradeDueRun } from "../../services/grading/gradeDueRunService";
import { previewLiveHrParlayMatches } from "../../services/grading/liveHrParlayService";
import { applyLiveHrParlayMatches } from "../../services/grading/liveHrParlayWriteService";
import { repairLegacyParlayIdentityForSync } from "./parlayRepairHelpers";

export const parlayStaffRoutes = Router();

parlayStaffRoutes.post("/parlays/live-hr-sync", requireAuth, requireStaff, gradingLimiter, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const rawDate = (req.body as { date?: string } | undefined)?.date ?? req.query.date;
  const date = optionalYmd(rawDate);
  const repair = await repairLegacyParlayIdentityForSync({
    dryRun: false,
    limit: 100,
    externalProvider: "live_hr_sync_repair",
    requestId: req.requestId,
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
  const payload = await executeGradeDueRun({
    days,
    source: "staff",
    requestId: req.requestId ?? "unknown",
    userId: req.user?.id ?? null,
  });

  return res.json(apiOkFlat(req, payload));
}));

parlayStaffRoutes.post("/parlays/repair-identity", requireAuth, requireStaff, gradingLimiter, asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
  const dryRun = String((req.body as { dryRun?: boolean } | undefined)?.dryRun ?? req.query.dryRun ?? "false") === "true";
  const limit = boundedInt((req.body as { limit?: number } | undefined)?.limit ?? req.query.limit, "limit", 100, 1, 250);
  const result = await repairLegacyParlayIdentityForSync({
    dryRun,
    limit,
    externalProvider: "staff_repair_identity",
    requestId: req.requestId,
  });

  return res.json(apiOkFlat(req, {
    mode: "repair_identity",
    ...result,
    checkedAt: new Date().toISOString(),
  }));
}));
