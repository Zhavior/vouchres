import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AURORA_ACCENT, AURORA_LABEL } from '../src/theme/auroraTokens';

const css = readFileSync(
  new URL('../src/styles/z8-design-system.css', import.meta.url),
  'utf8',
);
const primitives = readFileSync(
  new URL('../src/components/ui/primitives.tsx', import.meta.url),
  'utf8',
);

describe('Aurora production design contract', () => {
  it('uses verified emerald as the primary semantic accent', () => {
    expect(AURORA_ACCENT).toBe('text-vouch-emerald');
  });

  it('does not use sub-11px text for the shared label token', () => {
    expect(AURORA_LABEL).toContain('text-[11px]');
    expect(AURORA_LABEL).not.toMatch(/text-\[(?:8|9|10)px\]/);
  });

  it('provides touch-safe controls and visible keyboard focus', () => {
    expect(css).toContain('@utility z8-control');
    expect(css).toContain('min-height: 2.75rem');
    expect(css).toContain('&:focus-visible');
    expect(primitives).toContain('z8-control inline-flex');
  });

  it('supports reduced motion and readable line lengths', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('max-width: 75ch');
  });
});
