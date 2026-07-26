import { describe, expect, it } from 'vitest';
import { buildPremiumAuroraModel } from '../src/components/premiumAuroraModel';

describe('Aurora premium presentation model', () => {
  it('uses the billing API tier when the billing source responds', () => {
    expect(buildPremiumAuroraModel({
      profileTier: 'BASIC',
      billingSourceState: 'confirmed',
      billingStatus: { tier: 'pro', status: 'trialing' },
    })).toMatchObject({
      activeTier: 'GOLD',
      accessLabel: 'Beta research access',
      billingLabel: 'Trialing',
      hasPaidAccess: true,
      shouldManageBilling: true,
    });
  });

  it('labels a profile tier as unconfirmed when billing is unavailable', () => {
    expect(buildPremiumAuroraModel({
      profileTier: 'GOLD',
      billingSourceState: 'unavailable',
      billingStatus: null,
    })).toMatchObject({
      activeTier: 'GOLD',
      accessLabel: 'Paid access in profile',
      billingLabel: 'Billing source unavailable',
      hasPaidAccess: true,
    });
  });

  it('discloses cancellation returned by the billing source', () => {
    expect(buildPremiumAuroraModel({
      profileTier: 'GOLD',
      billingSourceState: 'confirmed',
      billingStatus: {
        tier: 'pro',
        status: 'active',
        cancelAtPeriodEnd: true,
      },
    }).billingDetail).toContain('Cancellation is scheduled');
  });
});
