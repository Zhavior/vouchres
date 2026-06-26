import type { Response, NextFunction } from "express";
import { AuthedRequest } from "./auth";

/**
 * Entitlements — server-side feature gates.
 *
 * NEVER trust the client's subscriptionTier. The client can lie. The server
 * reads the canonical tier from req.user.profile.tier (loaded from
 * public.profiles, synced from Stripe webhooks).
 *
 * Usage:
 *   router.post("/api/picks", requireAuth, requireTier("gold"), createPickHandler);
 *   router.post("/api/ai/explain-pick", requireAuth, requireTierOrQuota("free", 20, "ai_explain"), ...);
 */

type Tier = "free" | "gold" | "seller_pro";

const TIER_RANK: Record<Tier, number> = {
  free: 0,
  gold: 1,
  seller_pro: 2,
};

/**
 * Hard tier gate — reject if user's tier rank is below the required tier.
 */
export function requireTier(required: Tier) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const userTier = req.user?.profile.tier as Tier;
    if (!userTier) {
      return res.status(401).json({ error: "missing_token" });
    }
    if (TIER_RANK[userTier] < TIER_RANK[required]) {
      return res.status(402).json({
        error: "tier_required",
        required,
        current: userTier,
        upgrade_url: "/premium",
      });
    }
    next();
  };
}

/**
 * Quota gate — free users get N calls per day per quota_key; paid users bypass.
 *
 * Implementation: queries the picks/posts/etc. table for today's count by user.
 * For AI endpoints, query an explicit `ai_calls` table (or use Upstash Redis
 * for sub-millisecond checks — see implementation note below).
 *
 * For v1 of beta, the simplest correct implementation is a counter table:
 *
 *   create table public.daily_quotas (
 *     profile_id uuid not null references public.profiles(id) on delete cascade,
 *     quota_key  text not null,
 *     day        date not null,
 *     count      int not null default 0,
 *     primary key (profile_id, quota_key, day)
 *   );
 *
 * Increment in a transaction with the actual operation.
 */
export function requireTierOrQuota(
  required: Tier,
  freeDailyLimit: number,
  quotaKey: string
) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    const userTier = req.user?.profile.tier as Tier;
    if (!userTier) return res.status(401).json({ error: "missing_token" });

    // Paid tier bypasses quota
    if (TIER_RANK[userTier] >= TIER_RANK[required]) {
      return next();
    }

    // Free tier — check quota
    const { supabaseAdmin } = await import("./auth");
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabaseAdmin
      .from("daily_quotas")
      .select("count")
      .eq("profile_id", req.user!.id)
      .eq("quota_key", quotaKey)
      .eq("day", today)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows, that's fine
      console.error("[entitlements] quota check failed", error);
      return res.status(500).json({ error: "quota_check_failed" });
    }

    const current = data?.count ?? 0;
    if (current >= freeDailyLimit) {
      return res.status(429).json({
        error: "quota_exceeded",
        quota_key: quotaKey,
        limit: freeDailyLimit,
        used: current,
        resets_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        upgrade_url: "/premium",
      });
    }

    // Attach quota info to request for the handler to increment after success
    (req as any).__quota = { key: quotaKey, day: today, count: current };

    next();
  };
}

/**
 * Helper to call after a quota-gated operation succeeds.
 * Increments the daily quota counter.
 */
export async function incrementQuota(
  profileId: string,
  quotaKey: string,
  day: string
): Promise<void> {
  const { supabaseAdmin } = await import("./auth");
  // Upsert with explicit increment
  const { error } = await supabaseAdmin
    .from("daily_quotas")
    .upsert(
      { profile_id: profileId, quota_key: quotaKey, day, count: 1 },
      { onConflict: "profile_id,quota_key,day" }
    );

  if (error) {
    // Best-effort — log and continue. Don't fail the user's request because
    // we couldn't count it. (Trade-off: a user might get one extra call.)
    console.error("[entitlements] quota increment failed", error);
    return;
  }

  // Race-condition-tolerant increment via RPC
  await supabaseAdmin.rpc("increment_quota", {
    p_profile_id: profileId,
    p_quota_key: quotaKey,
    p_day: day,
  });
}

/*
 * Add this RPC to your schema.sql:
 *
 *   create or replace function public.increment_quota(
 *     p_profile_id uuid, p_quota_key text, p_day date
 *   ) returns void as $$
 *   begin
 *     update public.daily_quotas
 *       set count = count + 1
 *       where profile_id = p_profile_id
 *         and quota_key = p_quota_key
 *         and day = p_day;
 *   end;
 *   $$ language plpgsql security definer;
 *
 * And add the daily_quotas table:
 *
 *   create table public.daily_quotas (
 *     profile_id uuid not null references public.profiles(id) on delete cascade,
 *     quota_key  text not null,
 *     day        date not null,
 *     count      int not null default 0,
 *     primary key (profile_id, quota_key, day)
 *   );
 *
 * Recommended free-tier quotas for beta:
 *   picks_per_day:        3
 *   ai_explain:           10
 *   ai_daily_report:      1
 *   ai_learning_note:     5
 *   parlay_lab_saves:     2
 *   research_lookups:     15
 */
