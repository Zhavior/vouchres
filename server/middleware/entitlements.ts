import type { Response, NextFunction } from "express";
import { AuthedRequest } from "./auth";
import {
  getTierEntitlements,
  normalizeSubscriptionTier,
  type TierEntitlements,
} from "../services/billing/tierConfig";
import { AppError } from "../errors/AppError";

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

type Tier = "free" | "gold" | "seller_pro" | "pro" | "creator";

const TIER_RANK: Record<"free" | "pro" | "creator", number> = {
  free: 0,
  pro: 1,
  creator: 2,
};

function tierRank(tier: unknown): number {
  return TIER_RANK[normalizeSubscriptionTier(tier).tier];
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

type QuotaRequest = AuthedRequest & {
  __quota?: {
    key: string;
    day: string;
    count: number;
    limit: number;
  };
};

/**
 * Hard tier gate — reject if user's tier rank is below the required tier.
 */
export function requireTier(required: Tier) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const profileTier = req.user?.profile?.tier;
    if (!profileTier) {
      return next(new AppError({ status: 401, code: "missing_token", message: "Authentication token is required." }));
    }

    if (tierRank(profileTier) < tierRank(required)) {
      return next(new AppError({
        status: 403,
        code: "entitlement_required",
        message: "Your current plan does not include this feature.",
        details: {
          requiredTier: normalizeSubscriptionTier(required).tier,
          currentTier: normalizeSubscriptionTier(profileTier).tier,
        },
      }));
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
  return async (req: QuotaRequest, res: Response, next: NextFunction) => {
    const profile = req.user?.profile;
    if (!profile) {
      return next(new AppError({ status: 401, code: "missing_token", message: "Authentication token is required." }));
    }

    if (tierRank(profile.tier) >= tierRank(required)) {
      return next();
    }

    const day = todayUtc();
    const { supabaseAdmin } = await import("./auth");
    const { data, error } = await supabaseAdmin
      .from("daily_quotas")
      .select("count")
      .eq("profile_id", req.user!.id)
      .eq("quota_key", quotaKey)
      .eq("day", day)
      .maybeSingle();

    if (error) {
      console.error("[entitlements] quota lookup failed", {
        profileId: req.user!.id,
        quotaKey,
        day,
        error,
      });
      return next(new AppError({
        status: 503,
        code: "external_service_error",
        message: "Quota check is temporarily unavailable.",
        expose: true,
        cause: error,
      }));
    }

    const count = Number(data?.count ?? 0);
    if (count >= freeDailyLimit) {
      return next(new AppError({
        status: 429,
        code: "quota_exceeded",
        message: "Daily free quota exceeded.",
        details: {
          quotaKey,
          limit: freeDailyLimit,
          count,
          requiredTier: normalizeSubscriptionTier(required).tier,
          currentTier: normalizeSubscriptionTier(profile.tier).tier,
        },
      }));
    }

    req.__quota = { key: quotaKey, day, count, limit: freeDailyLimit };
    return next();
  };
}

export function getEntitlementsForTier(tier: unknown): TierEntitlements {
  return getTierEntitlements(tier);
}

export async function getUserEntitlements(userId: string): Promise<TierEntitlements> {
  const { supabaseAdmin } = await import("./auth");
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("tier")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[entitlements] profile lookup failed", error);
    return {
      ...getTierEntitlements("free"),
      warnings: ["Unable to load subscription tier; defaulted entitlements to free."],
    };
  }

  return getTierEntitlements(data?.tier ?? "free");
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

  const seed = await supabaseAdmin
    .from("daily_quotas")
    .upsert(
      { profile_id: profileId, quota_key: quotaKey, day, count: 0 },
      { onConflict: "profile_id,quota_key,day", ignoreDuplicates: true }
    );

  if (seed.error) {
    console.error("[entitlements] quota seed failed", seed.error);
    return;
  }

  const increment = await supabaseAdmin.rpc("increment_quota", {
    p_profile_id: profileId,
    p_quota_key: quotaKey,
    p_day: day,
  });

  if (!increment.error) return;

  console.error("[entitlements] quota rpc increment failed", increment.error);

  const current = await supabaseAdmin
    .from("daily_quotas")
    .select("count")
    .eq("profile_id", profileId)
    .eq("quota_key", quotaKey)
    .eq("day", day)
    .maybeSingle();

  if (current.error) {
    console.error("[entitlements] quota fallback read failed", current.error);
    return;
  }

  const nextCount = Number(current.data?.count ?? 0) + 1;
  const fallback = await supabaseAdmin
    .from("daily_quotas")
    .upsert(
      { profile_id: profileId, quota_key: quotaKey, day, count: nextCount },
      { onConflict: "profile_id,quota_key,day" }
    );

  if (fallback.error) {
    console.error("[entitlements] quota fallback increment failed", fallback.error);
  }
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
 *   agent_generate_picks: 5
 *   research_lookups:     15
 */
