import { Router } from "express";
import type { Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { apiOkFlat } from "../../lib/apiResponse";
import { assertCronAuthorized } from "../../lib/cronAuth";
import { AppError } from "../../errors/AppError";
import { boolQuery, boundedInt, optionalYmd } from "../../lib/requestValidators";
import type { RequestWithContext } from "../../middleware/requestContext";
import { getSupabaseAdmin } from "../../middleware/auth";
import { gradePendingPicks } from "../../services/grading/gradingService";
import { captureGradingFailure } from "../../lib/sentry";
import { applyLiveHrParlayMatches } from "../../services/grading/liveHrParlayWriteService";
import { partitionGradeDueResult } from "./parlayGradingResponses";
import {
  countParlayIntegrityRows,
  isLegacyManualEventId,
  repairLegacyParlayIdentityForSync,
} from "./parlayRepairHelpers";

/**
 * Cron-only parlay maintenance routes.
 *
 * Schedule (Vercel): see vercel.json → crons → `/api/cron/parlays/grade-due`
 *   - Default: `0 10 * * *` UTC (daily morning pass after West-coast finals)
 *   - Auth: `Authorization: Bearer $CRON_SECRET` (assertCronAuthorized)
 *
 * Multi-instance safety:
 *   - gradePendingPicks() uses process-local coalescing + Upstash distributed lock
 *     (`grading:pending-picks` in server/lib/distributedLock.ts) when Redis is configured.
 *   - Re-runs are idempotent: only `status=pending` picks are graded.
 */
export const parlayCronRoutes = Router();

parlayCronRoutes.get("/cron/parlays/live-hr-sync", asyncHandler(async (req: RequestWithContext, res: Response) => {
  assertCronAuthorized(req);

  const date = optionalYmd(req.query.date);
  const repair = await repairLegacyParlayIdentityForSync({
    dryRun: false,
    limit: 100,
    externalProvider: "cron_live_hr_sync_repair",
  });
  const result = await applyLiveHrParlayMatches(date);

  return res.json(apiOkFlat(req, {
    mode: "cron_live_hr_sync",
    date: date ?? null,
    repair,
    ...result,
    checkedAt: new Date().toISOString(),
  }));
}));

parlayCronRoutes.get("/cron/parlays/grade-due", asyncHandler(async (req: RequestWithContext, res: Response) => {
  assertCronAuthorized(req);

  const days = boundedInt(req.query.days, "days", 2, 1, 7);
  let result;
  try {
    result = await gradePendingPicks({ days });
  } catch (err) {
    captureGradingFailure(err, { source: "cron", cron: true, extra: { days, route: "grade-due" } });
    throw err;
  }
  const { settled, pending, errors, summary } = partitionGradeDueResult(result);
  const requestId = req.requestId ?? "unknown";

  console.log("[parlays/grade-due]", JSON.stringify({
    requestId,
    mode: "cron_grade_due",
    days,
    gradedParlays: settled.length,
    gradedLegs: result.graded.length,
    pendingLegs: pending.length,
    errorCount: errors.length,
  }));

  return res.json(apiOkFlat(req, {
    mode: "cron_grade_due",
    gradedParlays: settled.length,
    gradedLegs: result.graded.length,
    pendingLegs: pending.length,
    summary,
    warnings: summary.warnings,
    errors: errors.map((row) => ({ pick_id: row.pick_id, error: row.error })),
    checkedAt: new Date().toISOString(),
  }));
}));

parlayCronRoutes.get("/cron/parlays/integrity", asyncHandler(async (req: RequestWithContext, res: Response) => {
  assertCronAuthorized(req);
  const supabaseAdmin = await getSupabaseAdmin();

  const [
    missingEventKey,
    missingGameId,
    missingMarketCode,
    missingComparator,
    missingStatTarget,
    missingPlayerId,
    pendingLegs,
    cachedResults,
    weakHrTextLegs,
  ] = await Promise.all([
    countParlayIntegrityRows(supabaseAdmin.from("pick_legs").select("*", { count: "exact", head: true }).is("event_key", null)),
    countParlayIntegrityRows(supabaseAdmin.from("pick_legs").select("*", { count: "exact", head: true }).is("game_id", null)),
    countParlayIntegrityRows(supabaseAdmin.from("pick_legs").select("*", { count: "exact", head: true }).is("market_code", null)),
    countParlayIntegrityRows(supabaseAdmin.from("pick_legs").select("*", { count: "exact", head: true }).is("comparator", null)),
    countParlayIntegrityRows(supabaseAdmin.from("pick_legs").select("*", { count: "exact", head: true }).is("stat_target", null)),
    countParlayIntegrityRows(supabaseAdmin.from("pick_legs").select("*", { count: "exact", head: true }).is("player_id", null)),
    countParlayIntegrityRows(supabaseAdmin.from("pick_legs").select("*", { count: "exact", head: true }).eq("status", "pending")),
    countParlayIntegrityRows(supabaseAdmin.from("graded_leg_results").select("*", { count: "exact", head: true })),
    countParlayIntegrityRows(
      supabaseAdmin
        .from("pick_legs")
        .select("*", { count: "exact", head: true })
        .or("market.ilike.%hr%,selection.ilike.%home run%,selection.ilike.%homer%")
        .is("market_code", null),
    ),
  ]);

  const issues = {
    missingEventKey,
    missingGameId,
    missingMarketCode,
    missingComparator,
    missingStatTarget,
    missingPlayerId,
    weakHrTextLegs,
    pendingLegs,
  };

  const blockingIssueCount = Object.entries(issues)
    .filter(([key]) => key !== "pendingLegs")
    .reduce((sum, [, value]) => sum + Math.max(0, Number(value || 0)), 0);

  const envelope = apiOkFlat(req, {
    scanner: "parlay_integrity_nose",
    checkedAt: new Date().toISOString(),
    healthy: blockingIssueCount === 0,
    blockingIssueCount,
    issues,
    cache: {
      gradedLegResults: cachedResults,
    },
    advice:
      blockingIssueCount === 0
        ? "Parlay grading identity looks clean."
        : "Some legs are missing exact grading identity. New saves should use /api/parlays/save only; old rows may need repair/backfill.",
  });

  return res.json(envelope);
}));

parlayCronRoutes.post("/cron/parlays/repair-identity", asyncHandler(async (req: RequestWithContext, res: Response) => {
  assertCronAuthorized(req);

  const dryRun = boolQuery(req.query.dryRun, true);
  const limit = boundedInt(req.query.limit, "limit", 50, 1, 250);
  const result = await repairLegacyParlayIdentityForSync({
    dryRun,
    limit,
    externalProvider: "repair_identity",
  });

  return res.json(apiOkFlat(req, {
    ...result,
    checkedAt: new Date().toISOString(),
  }));
}));

parlayCronRoutes.get("/cron/parlays/repair-identity", asyncHandler(async (req: RequestWithContext, res: Response) => {
  assertCronAuthorized(req);

  const dryRun = boolQuery(req.query.dryRun, true);
  const limit = boundedInt(req.query.limit, "limit", 50, 1, 250);
  const result = await repairLegacyParlayIdentityForSync({
    dryRun,
    limit,
    externalProvider: "repair_identity",
  });

  return res.json(apiOkFlat(req, {
    ...result,
    checkedAt: new Date().toISOString(),
  }));
}));

parlayCronRoutes.post("/cron/parlays/quarantine-legacy", asyncHandler(async (req: RequestWithContext, res: Response) => {
  assertCronAuthorized(req);

  const dryRun = boolQuery(req.query.dryRun, true);
  const limit = boundedInt(req.query.limit, "limit", 25, 1, 100);
  const legacyReason = "Legacy pick saved before canonical grading identity existed; cannot be honestly graded.";

  const supabaseAdmin = await getSupabaseAdmin();

  const { data: picks, error } = await supabaseAdmin
    .from("picks")
    .select("id,event_id,status,explanation")
    .eq("status", "pending")
    .limit(limit);

  if (error) {
    console.error("[parlays/quarantine-legacy] fetch failed", error);
    throw new AppError({
      status: 503,
      code: "external_service_error",
      message: "Failed to fetch legacy parlays for quarantine.",
      details: { code: error.code, hint: error.hint },
      cause: error,
    });
  }

  const quarantined: any[] = [];
  const skipped: any[] = [];

  for (const pick of picks ?? []) {
    if (!isLegacyManualEventId(pick.event_id)) {
      skipped.push({
        pick_id: pick.id,
        event_id: pick.event_id,
        reason: "not_legacy_manual_event_id",
      });
      continue;
    }

    const pickPatch = {
      status: "void",
      explanation: [String(pick.explanation || "").trim(), legacyReason].filter(Boolean).join("\\n\\n"),
      graded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const legPatch = {
      status: "void",
      graded_at: new Date().toISOString(),
    };

    if (!dryRun) {
      const { error: pickUpdateError } = await supabaseAdmin
        .from("picks")
        .update(pickPatch)
        .eq("id", pick.id);

      if (pickUpdateError) {
        skipped.push({
          pick_id: pick.id,
          event_id: pick.event_id,
          reason: "pick_update_failed",
          message: pickUpdateError.message,
        });
        continue;
      }

      const { data: updatedLegs, error: legUpdateError } = await supabaseAdmin
        .from("pick_legs")
        .update(legPatch)
        .eq("pick_id", pick.id)
        .eq("status", "pending")
        .select("id,pick_id,status,graded_at,event_id,game_id");

      if (legUpdateError) {
        skipped.push({
          pick_id: pick.id,
          event_id: pick.event_id,
          reason: "leg_update_failed",
          message: legUpdateError.message,
        });
        continue;
      }

      if (!updatedLegs || updatedLegs.length === 0) {
        skipped.push({
          pick_id: pick.id,
          event_id: pick.event_id,
          reason: "no_pending_child_legs_updated",
        });
        continue;
      }
    }

    quarantined.push({
      pick_id: pick.id,
      event_id: pick.event_id,
      pickPatch,
      legPatch,
    });
  }

  return res.json(apiOkFlat(req, {
    dryRun,
    scanned: picks?.length ?? 0,
    quarantinedCount: quarantined.length,
    skippedCount: skipped.length,
    quarantined: quarantined.slice(0, 20),
    skipped: skipped.slice(0, 20),
    checkedAt: new Date().toISOString(),
  }));
}));
