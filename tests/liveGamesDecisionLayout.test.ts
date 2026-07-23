import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  new URL('../src/components/LiveGamesProZ8.tsx', import.meta.url),
  'utf8',
);

describe('Live Games decision-first layout', () => {
  it('puts the official spotlight scoreboard before deeper research panels', () => {
    expect(source).toContain('Spotlight Game Telemetry');
    expect(source).toContain('Live In-Game Score');
    expect(source).toContain('Deep Dive');
  });

  it('uses the dedicated live scoreboard visual system', () => {
    expect(source).toContain("import './live/live-games-lens.css';");
    // NOTE: live-games-lens.css still defines a `.live-game-focus` rule, but
    // the Z8 rewrite of this component no longer applies that class anywhere
    // — an orphaned style left over from the pre-Z8 migration, flagged here
    // rather than silently dropped.
    expect(source).toContain('LineScoreTable');
    expect(source).not.toContain('bg-vouch-cyan/20 blur-3xl');
  });

  it('uses an adaptive selector instead of nested horizontal scrolling for the game slate', () => {
    expect(source).toContain('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3');
    expect(source).not.toContain('flex gap-2 overflow-x-auto');
  });

  it('provides recovery for unavailable and empty live states', () => {
    expect(source).toContain('Reconnect Stream');
    expect(source).toContain('Show All Games');
  });

  it('does not duplicate the game collection or cover mobile content with an upsell', () => {
    expect(source).not.toContain('const GameCard');
    expect(source).not.toContain('Unlock Pro live modules');
  });
});
