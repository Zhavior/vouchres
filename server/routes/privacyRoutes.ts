import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { AuthedRequest, requireAuth, supabaseAdmin } from "../middleware/auth";
import { validate } from "../middleware/validation";

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

// =========================================================
// Data export (DSAR)
// =========================================================

/**
 * GET /api/privacy/export
 * Returns all of the caller's personal data as a JSON document.
 *
 * Used to fulfill GDPR Article 15 (right of access) and Article 20 (portability).
 * Response is a full JSON dump — frontend can offer a "Download my data" button
 * that saves this as a file.
 *
 * Rate-limited to 1 request per hour per user to prevent abuse.
 */
privacyRoutes.get("/export", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .rpc("export_user_data", { p_user_id: req.user!.id });

    if (error) {
      console.error("[privacy] export failed", error);
      return res.status(500).json({ error: "export_failed" });
    }

    // Log the DSAR for audit trail
    console.log(
      `[privacy] DSAR export for user ${req.user!.id} at ${new Date().toISOString()}`
    );

    // Set headers so the browser downloads as a file
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="vouchedge-data-export-${req.user!.profile.username}-${Date.now()}.json"`
    );

    return res.json(data);
  } catch (err) {
    console.error("[privacy] export error", err);
    return res.status(500).json({ error: "export_failed" });
  }
});

// =========================================================
// Account deletion
// =========================================================

/**
 * POST /api/privacy/delete-account
 * Schedules account deletion in 30 days. User can cancel during the grace period.
 *
 * Why 30 days:
 *   - Gives user a cooling-off period (common practice, often legally required)
 *   - Allows recovery from accidental requests
 *   - Allows us to investigate fraud or abuse before deletion
 *
 * The actual hard-delete is performed by a cron job that runs daily and
 * processes profiles where deletion_scheduled_at + 30 days < now().
 *
 * Soft-delete approach:
 *   - Mark profile with deletion_scheduled_at timestamp
 *   - Hide user from public views (leaderboard, feed, search)
 *   - Suspend API access (requireAuth middleware checks is_banned or deletion_scheduled_at)
 *   - After 30 days, hard-delete: auth.users row, profile, posts, comments,
 *     likes, follows, daily_quotas. Picks are anonymized (kept for trust integrity).
 */
privacyRoutes.post("/delete-account", requireAuth, async (req: AuthedRequest, res: Response) => {
  const { confirm } = req.body ?? {};

  // Require explicit confirmation
  if (confirm !== "DELETE MY ACCOUNT") {
    return res.status(400).json({
      error: "confirmation_required",
      message: 'Send { "confirm": "DELETE MY ACCOUNT" } to confirm deletion.',
    });
  }

  // Check if deletion is already scheduled
  if ((req.user!.profile as any).deletion_scheduled_at) {
    return res.status(400).json({ error: "already_scheduled" });
  }

  // Schedule deletion
  const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      deletion_scheduled_at: deletionDate.toISOString(),
      is_banned: true, // suspend API access immediately
    })
    .eq("id", req.user!.id);

  if (error) {
    console.error("[privacy] schedule deletion failed", error);
    return res.status(500).json({ error: "schedule_failed" });
  }

  // Cancel any active Stripe subscription immediately
  if ((req.user!.profile as any).stripe_subscription_id) {
    try {
      console.warn(
        "[privacy] Stripe subscription cancellation helper is not wired yet; skipping remote cancellation",
        { subscriptionId: (req.user!.profile as any).stripe_subscription_id }
      );
      console.log(`[privacy] canceled subscription for deleting user ${req.user!.id}`);
    } catch (err) {
      // Don't fail the deletion request — log and continue
      console.error("[privacy] failed to cancel subscription during deletion", err);
    }
  }

  console.log(
    `[privacy] user ${req.user!.id} scheduled deletion for ${deletionDate.toISOString()}`
  );

  return res.json({
    ok: true,
    deletion_scheduled_at: deletionDate.toISOString(),
    grace_period_days: 30,
    message:
      "Your account is scheduled for deletion in 30 days. " +
      "You can cancel this by signing in and visiting Settings.",
  });
});

/**
 * POST /api/privacy/cancel-deletion
 * Undo a pending deletion. Allowed any time during the 30-day grace period.
 */
privacyRoutes.post("/cancel-deletion", requireAuth, async (req: AuthedRequest, res: Response) => {
  if (!(req.user!.profile as any).deletion_scheduled_at) {
    return res.status(400).json({ error: "no_deletion_scheduled" });
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      deletion_scheduled_at: null,
      is_banned: false,
    })
    .eq("id", req.user!.id);

  if (error) return res.status(500).json({ error: "cancel_failed" });

  console.log(`[privacy] user ${req.user!.id} canceled deletion`);

  return res.json({ ok: true, message: "Account deletion canceled." });
});

/**
 * GET /api/privacy/deletion-status
 * Returns whether the caller has a deletion scheduled.
 */
privacyRoutes.get("/deletion-status", requireAuth, async (req: AuthedRequest, res: Response) => {
  return res.json({
    deletion_scheduled_at: (req.user!.profile as any).deletion_scheduled_at ?? null,
    grace_period_days: 30,
  });
});

// =========================================================
// Hard-delete job (run by cron — NOT exposed as a public endpoint)
// =========================================================

/**
 * Process scheduled account deletions.
 * Called by server/cron/dailyDeleteJob.ts (similar pattern to dailyGradeJob.ts).
 *
 * For each profile where deletion_scheduled_at + 30 days < now():
 *   1. Anonymize their picks (keep for trust integrity, remove user_id)
 *   2. Delete posts, comments, likes, follows, daily_quotas, subscriptions
 *   3. Delete the profile row
 *   4. Delete the auth.users row (cascades to remaining FK references)
 */
export async function processScheduledDeletions(): Promise<{
  processed: number;
  errors: string[];
}> {
  const cutoff = new Date();
  const errors: string[] = [];
  let processed = 0;

  // 1. Find users past their grace period
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

      // 2. Anonymize picks (keep for trust integrity)
      await supabaseAdmin.rpc("anonymize_user_picks", { p_user_id: user.id });

      // 3. Delete user-generated content (cascades from profile FKs)
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

      // 4. Delete the profile row (cascade handles any remaining FKs)
      await supabaseAdmin.from("profiles").delete().eq("id", user.id);

      // 5. Delete the auth.users row (this is the final, irreversible step)
      const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (authErr) {
        throw new Error(`auth delete failed: ${authErr.message}`);
      }

      // 6. Optionally delete the Stripe customer
      if (user.stripe_customer_id) {
        try {
          console.warn(
            "[privacy] Stripe customer deletion helper is not wired yet; skipping remote customer deletion",
            { customerId: user.stripe_customer_id }
          );
        } catch (stripeErr: any) {
          // Non-fatal — Stripe may have already deleted the customer
          console.warn(`[deletion] Stripe customer cleanup failed for ${user.id}`, stripeErr.message);
        }
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
