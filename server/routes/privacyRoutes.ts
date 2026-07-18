import { Router } from "express";
import type { Response } from "express";
import {
  AuthedRequest,
  bumpAuthUserEpoch,
  requireAuth,
  requireAuthAllowPendingDeletion,
  supabaseAdmin,
} from "../middleware/auth";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import { structuredLog } from "../lib/structuredLog";
import { AppError, isAppError } from "../errors/AppError";
import type { RequestWithContext } from "../middleware/requestContext";
import { validate } from "../middleware/validation";
import { PrivacyDeleteAccountSchema } from "../validators/mutationSchemas";
import { runWithDistributedLock } from "../lib/distributedLock";
import { isProductionRuntime } from "../lib/runtime";

/**
 * Privacy routes — GDPR / CCPA / CPRA compliance endpoints.
 *
 * These implement the rights promised in legal/PRIVACY_POLICY.md:
 *   - Right to access (DSAR)
 *   - Right to erasure ("right to be forgotten")
 *   - Right to portability (machine-readable export)
 *   - Right to rectification (profile update — already in authRoutes)
 *
 * Routes:
 *   GET  /api/privacy/export           — download all your data as JSON
 *   POST /api/privacy/delete-account   — schedule account deletion (30-day grace)
 *   POST /api/privacy/cancel-deletion  — undo a pending deletion
 *   GET  /api/privacy/deletion-status  — check if deletion is scheduled
 */
export const privacyRoutes = Router();

type PrivacyReq = AuthedRequest & RequestWithContext;

async function loadDsarRows(
  table: string,
  column: string,
  userId: string,
): Promise<{ rows: unknown[]; warning?: string }> {
  const result = await supabaseAdmin.from(table).select("*").eq(column, userId);
  if (!result.error) return { rows: result.data ?? [] };
  const code = String(result.error.code ?? "");
  if (code === "42P01" || code === "42703" || code === "PGRST205" || code === "PGRST204") {
    return { rows: [], warning: `skip missing ${table}.${column}` };
  }
  throw new Error(`${table} export failed: ${result.error.message}`);
}

privacyRoutes.get("/export", requireAuth, asyncHandler(async (req: PrivacyReq, res: Response) => {
  const userId = req.user!.id;
  const { data, error } = await supabaseAdmin
    .rpc("export_user_data", { p_user_id: userId });

  if (error) {
    structuredLog({
      level: "error",
      event: "privacy_export_failed",
      requestId: req.requestId,
      userId,
      message: error.message,
    });
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to export account data.",
      cause: error,
    });
  }

  // Supplement RPC export with surfaces hard-deletion already covers.
  const supplementalSpecs: Array<{ key: string; table: string; column: string }> = [
    { key: "notifications", table: "notifications", column: "user_id" },
    { key: "vouches", table: "vouches", column: "user_id" },
    { key: "stories", table: "user_stories", column: "user_id" },
    { key: "dm_messages", table: "dm_messages", column: "sender_id" },
    { key: "dm_participations", table: "dm_participants", column: "user_id" },
    { key: "parlay_tails", table: "parlay_tails", column: "user_id" },
    { key: "daily_quotas", table: "daily_quotas", column: "profile_id" },
    { key: "push_subscriptions", table: "push_subscriptions", column: "user_id" },
  ];
  const supplemental: Record<string, unknown> = {};
  const warnings: string[] = [];
  for (const spec of supplementalSpecs) {
    const loaded = await loadDsarRows(spec.table, spec.column, userId);
    supplemental[spec.key] = loaded.rows;
    if (loaded.warning) warnings.push(loaded.warning);
  }

  structuredLog({
    level: "info",
    event: "privacy_dsar_export",
    requestId: req.requestId,
    userId,
  });

  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="vouchedge-data-export-${req.user!.profile.username}-${Date.now()}.json"`,
  );

  const base = data && typeof data === "object" ? (data as Record<string, unknown>) : { rpc: data };
  return res.json(apiOkFlat(req, {
    data: {
      ...base,
      ...supplemental,
      export_warnings: warnings,
    },
  }));
}));

privacyRoutes.post(
  "/delete-account",
  requireAuth,
  validate({ body: PrivacyDeleteAccountSchema }),
  asyncHandler(async (req: PrivacyReq, res: Response) => {
  if ((req.user!.profile as any).deletion_scheduled_at) {
    throw new AppError({
      status: 400,
      code: "bad_request",
      message: "Account deletion is already scheduled.",
      details: { error: "already_scheduled" },
    });
  }

  const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Cancel billing BEFORE scheduling deletion so a failed cancel never leaves
  // a scheduled deletion with inconsistent entitlement state to roll back.
  try {
    const { cancelSubscriptionsForProfile } = await import("../services/billing/stripeService");
    const cancelResult = await cancelSubscriptionsForProfile(req.user!.id);
    structuredLog({
      level: cancelResult.warnings.length ? "warn" : "info",
      event: "privacy_stripe_cancel_on_deletion",
      requestId: req.requestId,
      userId: req.user!.id,
      canceled: cancelResult.canceled,
      warnings: cancelResult.warnings,
    });
    if (cancelResult.warnings.length > 0 && isProductionRuntime()) {
      throw new AppError({
        status: 503,
        code: "external_service_error",
        message: "Could not cancel billing. Account deletion was not scheduled. Please try again.",
        details: { error: "stripe_cancel_incomplete", warnings: cancelResult.warnings },
        expose: true,
      });
    }
  } catch (err) {
    if (isAppError(err)) throw err;
    structuredLog({
      level: "error",
      event: "privacy_stripe_cancel_failed",
      requestId: req.requestId,
      userId: req.user!.id,
      message: err instanceof Error ? err.message : String(err),
    });
    if (isProductionRuntime()) {
      throw new AppError({
        status: 503,
        code: "external_service_error",
        message: "Could not cancel billing. Account deletion was not scheduled. Please try again.",
        details: { error: "stripe_cancel_failed" },
        expose: true,
      });
    }
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      deletion_scheduled_at: deletionDate.toISOString(),
    })
    .eq("id", req.user!.id);

  if (error) {
    structuredLog({
      level: "error",
      event: "privacy_schedule_deletion_failed",
      requestId: req.requestId,
      userId: req.user!.id,
      message: error.message,
    });
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to schedule account deletion.",
      cause: error,
    });
  }

  await bumpAuthUserEpoch(req.user!.id);

  structuredLog({
    level: "info",
    event: "privacy_deletion_scheduled",
    requestId: req.requestId,
    userId: req.user!.id,
    deletionScheduledAt: deletionDate.toISOString(),
  });

  return res.json(apiOkFlat(req, {
    deletion_scheduled_at: deletionDate.toISOString(),
    grace_period_days: 30,
    message:
      "Your account is scheduled for deletion in 30 days. " +
      "You can cancel this by signing in and visiting Settings.",
  }));
}));

privacyRoutes.post("/cancel-deletion", requireAuthAllowPendingDeletion, asyncHandler(async (req: PrivacyReq, res: Response) => {
  if (!(req.user!.profile as any).deletion_scheduled_at) {
    throw new AppError({
      status: 400,
      code: "bad_request",
      message: "No account deletion is scheduled.",
      details: { error: "no_deletion_scheduled" },
    });
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      deletion_scheduled_at: null,
    })
    .eq("id", req.user!.id);

  if (error) {
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to cancel account deletion.",
      cause: error,
    });
  }

  await bumpAuthUserEpoch(req.user!.id);

  structuredLog({
    level: "info",
    event: "privacy_deletion_canceled",
    requestId: req.requestId,
    userId: req.user!.id,
  });

  return res.json(apiOkFlat(req, { message: "Account deletion canceled." }));
}));

privacyRoutes.get("/deletion-status", requireAuthAllowPendingDeletion, asyncHandler(async (req: PrivacyReq, res: Response) => {
  return res.json(apiOkFlat(req, {
    deletion_scheduled_at: (req.user!.profile as any).deletion_scheduled_at ?? null,
    grace_period_days: 30,
  }));
}));

/**
 * Process scheduled account deletions.
 * Called by server/cron/dailyDeleteJob.ts (similar pattern to dailyGradeJob.ts).
 */
export async function processScheduledDeletions(): Promise<{
  processed: number;
  errors: string[];
}> {
  try {
    return await runWithDistributedLock(
      "cron:account-deletion",
      () => processScheduledDeletionsUnlocked(),
      { ttlSeconds: 900, waitMs: 5_000 },
    );
  } catch (err) {
    if (isAppError(err) && err.code === "conflict") {
      console.warn("[deletion] skipped — another deletion job holds the lock");
      return { processed: 0, errors: ["deletion job already running"] };
    }
    throw err;
  }
}

async function processScheduledDeletionsUnlocked(): Promise<{
  processed: number;
  errors: string[];
}> {
  const cutoff = new Date();
  const errors: string[] = [];
  let processed = 0;

  const { data: toDelete, error } = await supabaseAdmin
    .from("profiles")
    .select("id, username, email, stripe_customer_id")
    .not("deletion_scheduled_at", "is", null)
    .lt("deletion_scheduled_at", cutoff.toISOString())
    .limit(100);

  if (error) {
    console.error("[deletion] fetch failed", error);
    return { processed: 0, errors: [error.message] };
  }

  if (!toDelete || toDelete.length === 0) {
    return { processed: 0, errors: [] };
  }

  for (const user of toDelete) {
    try {
      console.log(`[deletion] processing user ${user.id} (${user.username})`);

      const { error: anonymizeError } = await supabaseAdmin.rpc("anonymize_user_picks", {
        p_user_id: user.id,
      });
      if (anonymizeError) {
        throw new Error(`anonymize_user_picks failed: ${anonymizeError.message}`);
      }

      // Belt-and-suspenders: trust_scores has no FK to profiles — always wipe explicitly.
      const trustWipe = await supabaseAdmin
        .from("trust_scores")
        .delete()
        .eq("subject_type", "user")
        .eq("subject_id", String(user.id));
      if (trustWipe.error) {
        const code = String(trustWipe.error.code ?? "");
        if (code !== "42P01" && code !== "PGRST205") {
          throw new Error(`trust_scores wipe failed: ${trustWipe.error.message}`);
        }
        console.warn(`[deletion] skip trust_scores: ${trustWipe.error.message}`);
      }

      // Best-effort wipe of user-owned rows. Missing tables are ignored; other errors fail the job.
      const deleteSpecs: Array<{ table: string; column: string }> = [
        { table: "post_likes", column: "profile_id" },
        { table: "post_comments", column: "author_id" },
        { table: "posts", column: "author_id" },
        { table: "follows", column: "follower_id" },
        { table: "follows", column: "following_profile_id" },
        { table: "daily_quotas", column: "profile_id" },
        { table: "subscriptions", column: "profile_id" },
        { table: "beta_signups", column: "activated_user_id" },
        { table: "notifications", column: "user_id" },
        { table: "push_subscriptions", column: "user_id" },
        { table: "vouches", column: "user_id" },
        { table: "user_status_notes", column: "user_id" },
        { table: "user_stories", column: "user_id" },
        { table: "story_views", column: "viewer_id" },
        { table: "comment_likes", column: "profile_id" },
        { table: "parlay_tails", column: "user_id" },
        { table: "parlay_tails", column: "source_user_id" },
        { table: "dm_messages", column: "sender_id" },
        { table: "dm_participants", column: "user_id" },
        { table: "subscriber_channel_messages", column: "author_id" },
      ];

      for (const spec of deleteSpecs) {
        const result = await supabaseAdmin.from(spec.table).delete().eq(spec.column, user.id);
        if (!result.error) continue;
        const code = String(result.error.code ?? "");
        // Undefined table / column in some envs — do not block erasure of the rest.
        if (code === "42P01" || code === "42703" || code === "PGRST205" || code === "PGRST204") {
          console.warn(`[deletion] skip missing ${spec.table}.${spec.column}: ${result.error.message}`);
          continue;
        }
        throw new Error(`related-row delete failed (${spec.table}): ${result.error.message}`);
      }

      if (user.stripe_customer_id) {
        const { deleteStripeCustomer } = await import("../services/billing/stripeService");
        await deleteStripeCustomer(String(user.stripe_customer_id));
      }

      const profileDelete = await supabaseAdmin.from("profiles").delete().eq("id", user.id);
      if (profileDelete.error) {
        throw new Error(`profile delete failed: ${profileDelete.error.message}`);
      }

      const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (authErr) {
        throw new Error(`auth delete failed: ${authErr.message}`);
      }

      processed++;
      console.log(`[deletion] completed user ${user.id}`);
    } catch (err: any) {
      console.error(`[deletion] failed for user ${user.id}:`, err.message);
      errors.push(`user ${user.id}: ${err.message}`);
    }
  }

  console.log(`[deletion] batch complete: ${processed} processed, ${errors.length} errors`);
  return { processed, errors };
}
