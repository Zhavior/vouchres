export type BillingTier = 'free' | 'pro' | 'creator' | 'gold' | 'seller_pro';
export type ProfileSubscriptionTier = 'BASIC' | 'GOLD' | 'SELLER_PRO';

/**
 * Translate the canonical billing API contract into the legacy profile shape.
 * Database aliases remain accepted until the profile schema is migrated.
 */
export function tierToSubscriptionTier(tier: unknown): ProfileSubscriptionTier {
  const normalized = String(tier ?? 'free').trim().toLowerCase();
  if (normalized === 'pro' || normalized === 'gold') return 'GOLD';
  if (normalized === 'creator' || normalized === 'seller_pro') return 'SELLER_PRO';
  return 'BASIC';
}
