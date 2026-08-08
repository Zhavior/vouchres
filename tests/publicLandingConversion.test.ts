import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const terminalSource = readFileSync(
  new URL('../src/pages/VouchEdgeTerminalPage.tsx', import.meta.url),
  'utf8',
);
const heroSource = readFileSync(
  new URL('../src/components/landing/aurora/AuroraHero.tsx', import.meta.url),
  'utf8',
);
const pricingSource = readFileSync(
  new URL('../src/components/landing-v3/PricingSection.tsx', import.meta.url),
  'utf8',
);

describe('public landing conversion contract', () => {
  it('states the customer outcome and trust boundaries on the mounted landing', () => {
    expect(terminalSource).toContain('<VouchEdgeLandingV3');
    expect(heroSource).toContain('The game begins.');
    expect(heroSource).toContain('Before the first pitch.');
    expect(heroSource).toContain('Official game context');
    expect(heroSource).toContain('Transparent reasoning');
    expect(heroSource).toContain('Results stay visible');
    expect(heroSource).not.toContain('pristine');
  });

  it('offers the real beta action and discloses its trial and price', () => {
    expect(heroSource).toContain('Join Beta');
    expect(heroSource).toContain('onJoinBeta');
    expect(heroSource).toContain('Login');
    expect(pricingSource).toContain('Try every Beta research tool free for 7 days.');
    expect(pricingSource).toContain('continue for $7.99 per month until you cancel.');
  });

  it('uses touch-safe conversion controls', () => {
    expect(heroSource).toContain('min-h-11');
    expect(heroSource).toContain('min-h-14');
  });
});
