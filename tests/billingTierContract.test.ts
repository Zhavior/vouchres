import { describe, expect, it } from 'vitest';
import { tierToSubscriptionTier } from '../src/lib/subscriptionTier';
import { mapAuthMeToCreatorProof } from '../src/lib/profileFromAuth';

describe('billing tier contract', () => {
  it('maps canonical API tiers into the legacy frontend profile shape', () => {
    expect(tierToSubscriptionTier('free')).toBe('BASIC');
    expect(tierToSubscriptionTier('pro')).toBe('GOLD');
    expect(tierToSubscriptionTier('creator')).toBe('SELLER_PRO');
  });

  it('keeps database tier aliases compatible during migration', () => {
    expect(tierToSubscriptionTier('gold')).toBe('GOLD');
    expect(tierToSubscriptionTier('seller_pro')).toBe('SELLER_PRO');
  });

  it('maps canonical auth profile tiers consistently with billing status', () => {
    expect(mapAuthMeToCreatorProof({ tier: 'pro' }).subscriptionTier).toBe('GOLD');
    expect(mapAuthMeToCreatorProof({ tier: 'creator' }).subscriptionTier).toBe('SELLER_PRO');
  });
});
