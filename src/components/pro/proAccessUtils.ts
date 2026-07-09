import { CreatorProofProfile } from '../../types';

export type RequiredTier = 'GOLD' | 'SELLER_PRO';

const TIER_RANK: Record<string, number> = {
  BASIC: 0,
  GOLD: 1,
  SELLER_PRO: 2,
};

export function normalizeSubscriptionTier(tier?: string | null): keyof typeof TIER_RANK {
  const normalized = String(tier ?? 'BASIC').trim().toUpperCase();
  if (normalized === 'FREE') return 'BASIC';
  if (normalized === 'GOLD') return 'GOLD';
  if (normalized === 'SELLER_PRO' || normalized === 'SELLER PRO' || normalized === 'PRO') return 'SELLER_PRO';
  return 'BASIC';
}

/** True if the profile meets at least the given tier (defaults to GOLD). */
export function hasTierAccess(
  profile: Pick<CreatorProofProfile, 'subscriptionTier'>,
  required: RequiredTier = 'GOLD',
): boolean {
  return TIER_RANK[normalizeSubscriptionTier(profile.subscriptionTier)] >= TIER_RANK[required];
}

/** Backwards-compatible helper: true for GOLD or SELLER_PRO. */
export function isProUser(profile: Pick<CreatorProofProfile, 'subscriptionTier'>): boolean {
  return hasTierAccess(profile, 'GOLD');
}

/** Profile cover/banner theme customization requires Gold or higher. */
export function canCustomizeProfileHeader(
  profile: Pick<CreatorProofProfile, 'subscriptionTier'>,
  opts?: { isPro?: boolean; isStaff?: boolean },
): boolean {
  if (opts?.isPro || opts?.isStaff) return true;
  return hasTierAccess(profile, 'GOLD');
}
