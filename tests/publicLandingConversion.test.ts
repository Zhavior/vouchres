import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The landing page was rebuilt as VouchEdgeLandingV3; VouchEdgeTerminalPage is
// now a thin auth/routing wrapper that renders it. Hero conversion copy lives in
// AuroraHero, and the trial terms live in the pricing section.
const hero = readFileSync(
  new URL('../src/components/landing/aurora/AuroraHero.tsx', import.meta.url),
  'utf8',
);
const pricing = readFileSync(
  new URL('../src/components/landing-v3/PricingSection.tsx', import.meta.url),
  'utf8',
);
const tokens = readFileSync(
  new URL('../src/components/landing/LandingTokens.ts', import.meta.url),
  'utf8',
);

describe('public landing conversion contract', () => {
  it('states the customer outcome before product jargon', () => {
    expect(hero).toContain('Before the first pitch.');
    expect(hero).toContain('every signal, every reason, and every result');
    expect(hero).not.toContain('pristine');
  });

  it('offers one primary action with a clear sign-in path', () => {
    expect(hero).toContain('Join Open Beta');
    expect(hero).toContain('Log in');
    // Exactly one primary conversion CTA — the secondary action is a preview,
    // not a second competing signup.
    expect(hero).toContain('See live research preview');
  });

  it('keeps hero trust claims to things the product actually does', () => {
    expect(hero).toContain('Official game context');
    expect(hero).toContain('Transparent reasoning');
    expect(hero).toContain('Results stay visible');
    // No unearned guarantees about accuracy or winnings.
    expect(hero).not.toMatch(/guaranteed|win rate|profit/i);
  });

  it('states the trial terms and the price it converts to', () => {
    expect(pricing).toContain('free for 7 days');
    expect(pricing).toContain('$7.99 per month until you cancel');
  });

  it('uses touch-safe emerald conversion controls', () => {
    expect(tokens).toContain('z8-control');
    expect(tokens).toContain('border-vouch-emerald/55 bg-vouch-emerald');
  });
});
