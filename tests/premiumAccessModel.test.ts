import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/betaAccess', () => ({
  FREE_BETA_ALL_ACCESS: false,
  PAYMENTS_ENABLED: true,
  FREE_BETA_ENDS_AT: null,
  FREE_BETA_HEADLINE: 'Free open beta',
  FREE_BETA_BLURB: 'Every feature is unlocked for every account during the beta.',
}));

const { buildPremiumAccessModel } = await import('../src/components/premiumAccessModel');

describe('Aurora Max premium presentation model', () => {
  it('uses the billing API tier when the billing source responds', () => {
    expect(buildPremiumAccessModel({
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
    expect(buildPremiumAccessModel({
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
    expect(buildPremiumAccessModel({
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
