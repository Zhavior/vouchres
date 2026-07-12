import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  new URL('../src/pages/VouchEdgeTerminalPage.tsx', import.meta.url),
  'utf8',
);
const tokens = readFileSync(
  new URL('../src/components/landing/LandingTokens.ts', import.meta.url),
  'utf8',
);

describe('public landing conversion contract', () => {
  it('states the customer outcome before product jargon', () => {
    expect(source).toContain("Understand today&apos;s home run candidates");
    expect(source).toContain('power, pitcher risk, park context, lineup status, and model confidence');
    expect(source).not.toContain('pristine');
  });

  it('offers one honest free-account action with a clear sign-in path', () => {
    expect(source).toContain('Start researching free');
    expect(source).toContain('No credit card required');
    expect(source).toContain('Already have an account? Sign in');
  });

  it('uses touch-safe emerald conversion controls', () => {
    expect(tokens).toContain('z8-control');
    expect(tokens).toContain('border-vouch-emerald/55 bg-vouch-emerald');
  });
});
