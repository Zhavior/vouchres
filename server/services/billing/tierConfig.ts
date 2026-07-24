export type CanonicalTier = "free" | "pro" | "creator";
export type PaidCanonicalTier = Exclude<CanonicalTier, "free">;
export type DatabaseTier = "free" | "gold" | "seller_pro";
export type BillingInterval = "monthly" | "yearly";

export interface TierNormalization {
  tier: CanonicalTier;
  sourceTier: string | null;
  isActiveTier: boolean;
  warnings: string[];
}

export interface TierEntitlements {
  tier: CanonicalTier;
  monthlyCustomizationPoints: number;
  canUseProGraphs: boolean;
  canUseTeamMatchupLab: boolean;
  canUsePlayerEdgeLab: boolean;
  canAccessNotifications: boolean;
  warnings: string[];
}

export const ACTIVE_TIERS: readonly CanonicalTier[] = ["free", "pro", "creator"];

export const TIER_CUSTOMIZATION_POINTS: Record<CanonicalTier, number> = {
  free: 0,
  pro: 250,
  creator: 850,
};

export const DATABASE_TIER_BY_CANONICAL: Record<CanonicalTier, DatabaseTier> = {
  free: "free",
  pro: "gold",
  creator: "seller_pro",
};

export const CANONICAL_TIER_BY_DATABASE: Record<DatabaseTier, CanonicalTier> = {
  free: "free",
  gold: "pro",
  seller_pro: "creator",
};

export function isActiveTier(tier: unknown): tier is CanonicalTier {
  return typeof tier === "string" && ACTIVE_TIERS.includes(tier as CanonicalTier);
}

export function normalizeSubscriptionTier(tier: unknown): TierNormalization {
  const sourceTier = typeof tier === "string" ? tier.trim().toLowerCase() : null;
  const warnings: string[] = [];

  if (!sourceTier) {
    return { tier: "free", sourceTier, isActiveTier: false, warnings };
  }

  if (isActiveTier(sourceTier)) {
    return { tier: sourceTier, sourceTier, isActiveTier: true, warnings };
  }

  if (sourceTier === "gold" || sourceTier === "seller_pro") {
    return {
      tier: CANONICAL_TIER_BY_DATABASE[sourceTier],
      sourceTier,
      isActiveTier: false,
      warnings,
    };
  }

  if (sourceTier === "elite") {
    warnings.push("Legacy elite tier is not active; customization points defaulted to free.");
  } else {
    warnings.push(`Unknown subscription tier "${sourceTier}"; customization points defaulted to free.`);
  }

  return { tier: "free", sourceTier, isActiveTier: false, warnings };
}

export function getTierCustomizationPoints(tier: unknown): number {
  return isActiveTier(tier) ? TIER_CUSTOMIZATION_POINTS[tier] : 0;
}

export function getTierEntitlements(tier: unknown): TierEntitlements {
  const normalized = normalizeSubscriptionTier(tier);
  const paid = normalized.tier === "pro" || normalized.tier === "creator";

  return {
    tier: normalized.tier,
    monthlyCustomizationPoints: getTierCustomizationPoints(normalized.tier),
    canUseProGraphs: paid,
    canUseTeamMatchupLab: paid,
    canUsePlayerEdgeLab: paid,
    canAccessNotifications: true,
    warnings: normalized.warnings,
  };
}

export function getStripePriceId(tier: PaidCanonicalTier, interval: BillingInterval): string | undefined {
  if (tier === "pro" && interval === "monthly") {
    return process.env.STRIPE_BETA_MONTHLY_PRICE_ID ?? process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
  }
  const envName = `STRIPE_${tier.toUpperCase()}_${interval.toUpperCase()}_PRICE_ID`;
  return process.env[envName];
}

export function getStripePriceMatrix() {
  return {
    pro: {
      monthly: getStripePriceId("pro", "monthly") ?? null,
      yearly: null,
    },
    creator: {
      monthly: process.env.STRIPE_CREATOR_MONTHLY_PRICE_ID ?? null,
      yearly: process.env.STRIPE_CREATOR_YEARLY_PRICE_ID ?? null,
    },
  };
}
