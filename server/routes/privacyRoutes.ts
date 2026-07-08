import { Router } from "express";
import type { Response } from "express";
import { AuthedRequest, requireAuth, supabaseAdmin } from "../middleware/auth";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../errors/AppError";

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

privacyRoutes.get("/export", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { data, error } = await supabaseAdmin
    .rpc("export_user_data", { p_user_id: req.user!.id });

  if (error) {
    console.error("[privacy] export failed", error);
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to export account data.",
      cause: error,
    });
  }

  console.log(
    `[privacy] DSAR export for user ${req.user!.id} at ${new Date().toISOString()}`,
  );

  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="vouchedge-data-export-${req.user!.profile.username}-${Date.now()}.json"`,
  );

  return res.json({ ok: true, data });
}));

privacyRoutes.post("/delete-account", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { confirm } = req.body ?? {};

  if (confirm !== "DELETE MY ACCOUNT") {
    throw new AppError({
      status: 400,
      code: "bad_request",
      message: 'Send { "confirm": "DELETE MY ACCOUNT" } to confirm deletion.',
      details: { error: "confirmation_required" },
    });
  }

  if ((req.user!.profile as any).deletion_scheduled_at) {
    throw new AppError({
      status: 400,
      code: "bad_request",
      message: "Account deletion is already scheduled.",
      details: { error: "already_scheduled" },
    });
  }

  const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      deletion_scheduled_at: deletionDate.toISOString(),
      is_banned: true,
    })
    .eq("id", req.user!.id);

  if (error) {
    console.error("[privacy] schedule deletion failed", error);
    throw new AppError({
      status: 500,
      code: "internal_server_error",
      message: "Failed to schedule account deletion.",
      cause: error,
    });
  }

  if ((req.user!.profile as any).stripe_subscription_id) {
    console.warn(
      "[privacy] Stripe subscription cancellation helper is not wired yet; skipping remote cancellation",
      { subscriptionId: (req.user!.profile as any).stripe_subscription_id },
    );
  }

  console.log(
    `[privacy] user ${req.user!.id} scheduled deletion for ${deletionDate.toISOString()}`,
  );

  return res.json({
    ok: true,
    deletion_scheduled_at: deletionDate.toISOString(),
    grace_period_days: 30,
    message:
      "Your account is scheduled for deletion in 30 days. " +
      "You can cancel this by signing in and visiting Settings.",
  });
}));

privacyRoutes.post("/cancel-deletion", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
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
      is_banned: false,
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

  console.log(`[privacy] user ${req.user!.id} canceled deletion`);

  return res.json({ ok: true, message: "Account deletion canceled." });
}));

privacyRoutes.get("/deletion-status", requireAuth, asyncHandler(async (req: AuthedRequest, res: Response) => {
  return res.json({
    ok: true,
    deletion_scheduled_at: (req.user!.profile as any).deletion_scheduled_at ?? null,
    grace_period_days: 30,
  });
}));

/**
 * Process scheduled account deletions.
 * Called by server/cron/dailyDeleteJob.ts (similar pattern to dailyGradeJob.ts).
 */
export async function processScheduledDeletions(): Promise<{
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

      await supabaseAdmin.rpc("anonymize_user_picks", { p_user_id: user.id });

      await Promise.all([
        supabaseAdmin.from("post_likes").delete().eq("profile_id", user.id),
        supabaseAdmin.from("post_comments").delete().eq("author_id", user.id),
        supabaseAdmin.from("posts").delete().eq("author_id", user.id),
        supabaseAdmin.from("follows").delete().eq("follower_id", user.id),
        supabaseAdmin.from("follows").delete().eq("following_profile_id", user.id),
        supabaseAdmin.from("daily_quotas").delete().eq("profile_id", user.id),
        supabaseAdmin.from("subscriptions").delete().eq("profile_id", user.id),
        supabaseAdmin.from("beta_signups").delete().eq("activated_user_id", user.id),
      ]);

      await supabaseAdmin.from("profiles").delete().eq("id", user.id);

      const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (authErr) {
        throw new Error(`auth delete failed: ${authErr.message}`);
      }

      if (user.stripe_customer_id) {
        console.warn(
          "[privacy] Stripe customer deletion helper is not wired yet; skipping remote customer deletion",
          { customerId: user.stripe_customer_id },
        );
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
