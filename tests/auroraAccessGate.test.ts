import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  getProAccessPresentation,
  hasServerAccessForTier,
} from '../src/components/pro/proAccessPresentation';

describe('Aurora access gate', () => {
  it('does not sell Seller Pro through the Beta checkout', () => {
    const creator = getProAccessPresentation('SELLER_PRO');

    expect(creator.disclosure).toContain('not sold through the current VouchEdge Beta checkout');
    expect(creator.ctaLabel).toBe('Review account access');
    expect(JSON.stringify(creator)).not.toContain('$49.99');
    expect(JSON.stringify(creator)).not.toContain('elite verification');
  });

  it('requires creator entitlement for Seller Pro surfaces', () => {
    expect(hasServerAccessForTier('SELLER_PRO', { isPro: true, isCreator: false })).toBe(false);
    expect(hasServerAccessForTier('SELLER_PRO', { isPro: true, isCreator: true })).toBe(true);
    expect(hasServerAccessForTier('GOLD', { isPro: true, isCreator: false })).toBe(true);
  });

  it('keeps the checkout-backed Beta terms consistent', () => {
    const beta = getProAccessPresentation('GOLD');

    expect(beta.disclosure).toContain('7 days free, then $7.99 per month');
    expect(beta.ctaLabel).toBe('Review Beta access');
  });

  it('removes the unsupported Seller checkout from Settings', () => {
    const settings = readFileSync('src/components/SettingsPageZ8.tsx', 'utf8');

    expect(settings).not.toContain("price: '$49.99'");
    expect(settings).toContain('Creator access is not sold through the current VouchEdge Beta checkout.');
    expect(settings).toContain('billingModel.billingLabel');
  });
});
