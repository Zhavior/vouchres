import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  new URL('../src/components/LiveGamesPro.tsx', import.meta.url),
  'utf8',
);

describe('Live Games decision-first layout', () => {
  it('puts official game state before model research', () => {
    expect(source).toContain('Official game state first.');
    expect(source).toContain('Current game');
    expect(source).toContain('Open matchup');
  });

  it('uses an adaptive selector instead of nested horizontal scrolling', () => {
    expect(source).toContain('grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4');
    expect(source).not.toContain('flex gap-2 overflow-x-auto');
  });

  it('provides recovery for unavailable and empty live states', () => {
    expect(source).toContain('Try again');
    expect(source).toContain("Show today&apos;s schedule");
  });

  it('does not duplicate the game collection or cover mobile content with an upsell', () => {
    expect(source).not.toContain('const GameCard');
    expect(source).not.toContain('Unlock Pro live modules');
  });
});
