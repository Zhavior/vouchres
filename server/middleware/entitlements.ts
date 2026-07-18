import type { Response, NextFunction } from "express";
import { AuthedRequest } from "./auth";
import {
  getTierEntitlements,
  normalizeSubscriptionTier,
  type TierEntitlements,
} from "../services/billing/tierConfig";
import { AppError } from "../errors/AppError";
import { runWithDistributedLock } from "../lib/distributedLock";

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
  quotaKey: string,
  /**
   * Hard daily ceiling applied EVEN to paid tiers — cost protection for
   * expensive paid-API endpoints (Gemini image/theme/etc). Without it, a paid
   * (or leaked) token is capped only by the per-minute rate limiter, i.e.
   * thousands of the most expensive calls per day for a flat monthly fee.
   * Omit only for gates where the paid tier is genuinely meant to be unlimited.
   */
  paidDailyLimit?: number
) {
  return async (req: QuotaRequest, res: Response, next: NextFunction) => {
    const profile = req.user?.profile;
    if (!profile) {
      return next(new AppError({ status: 401, code: "missing_token", message: "Authentication token is required." }));
    }

    const isPaid = tierRank(profile.tier) >= tierRank(required);

    // Paid tiers use the higher paid ceiling when one is configured; only a
    // paid tier with NO paid ceiling is truly unlimited (legacy behavior).
    if (isPaid && paidDailyLimit === undefined) {
      return next();
    }
    const effectiveLimit = isPaid ? (paidDailyLimit as number) : freeDailyLimit;

    const day = todayUtc();
    const profileId = req.user!.id;

    // Reserve a slot under a per-user lock before the handler runs so parallel
    // requests cannot all pass a stale check-then-act read.
    try {
      const reserved = await runWithDistributedLock(
        `quota:${profileId}:${quotaKey}:${day}`,
        async () => {
          const { supabaseAdmin } = await import("./auth");
          const { data, error } = await supabaseAdmin
            .from("daily_quotas")
            .select("count")
            .eq("profile_id", profileId)
            .eq("quota_key", quotaKey)
            .eq("day", day)
            .maybeSingle();

          if (error) {
            throw new AppError({
              status: 503,
              code: "external_service_error",
              message: "Quota check is temporarily unavailable.",
              expose: true,
              cause: error,
            });
          }

          const count = Number(data?.count ?? 0);
          if (count >= effectiveLimit) {
            throw new AppError({
              status: 429,
              code: "quota_exceeded",
              message: isPaid
                ? "Daily usage limit reached for this feature."
                : "Daily free quota exceeded.",
              details: {
                quotaKey,
                limit: effectiveLimit,
                count,
                requiredTier: normalizeSubscriptionTier(required).tier,
                currentTier: normalizeSubscriptionTier(profile.tier).tier,
              },
            });
          }

          await incrementQuotaCounter(profileId, quotaKey, day);
          return count + 1;
        },
        { ttlSeconds: 30, waitMs: 10_000 },
      );

      req.__quota = { key: quotaKey, day, count: reserved, limit: effectiveLimit };
      return next();
    } catch (error) {
      return next(error);
    }
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
 * Legacy helper kept for route call sites. Quota is now reserved atomically
 * inside requireTierOrQuota before the handler runs — this is a no-op so
 * successful handlers do not double-count.
 */
export async function incrementQuota(
  _profileId: string,
  _quotaKey: string,
  _day: string
): Promise<void> {
  return;
}

/** Internal counter bump used by the reserved quota gate. */
async function incrementQuotaCounter(
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
    throw new AppError({
      status: 503,
      code: "external_service_error",
      message: "Quota tracking is temporarily unavailable.",
      expose: true,
      cause: seed.error,
    });
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
    throw new AppError({
      status: 503,
      code: "external_service_error",
      message: "Quota tracking is temporarily unavailable.",
      expose: true,
      cause: current.error,
    });
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
    throw new AppError({
      status: 503,
      code: "external_service_error",
      message: "Quota tracking is temporarily unavailable.",
      expose: true,
      cause: fallback.error,
    });
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
