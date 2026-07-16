import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  new URL('../src/components/TodayDashboard.tsx', import.meta.url),
  'utf8',
);

describe('Today decision-first layout', () => {
  it('leads with one state-driven decision and a limited attention list', () => {
    expect(source).toContain("buildTodayDecision({");
    expect(source).toContain('<TodayDecisionReel');
    expect(source).toContain('Three things, maximum');
  });

  it('keeps the quick launcher compact and routes to canonical workspaces', () => {
    expect(source).toContain("section: 'hr_board'");
    expect(source).toContain("section: 'live_parlays'");
    expect(source).toContain("section: 'results'");
    expect(source).not.toContain('Browse all specialist tools');
    expect(source).not.toContain('Top HR Intelligence');
    expect(source).not.toContain('Top Pitcher Targets');
  });

  it('uses the shared touch-safe control contract', () => {
    expect(source).toContain('z8-control inline-flex min-h-9 items-center');
  });

  it('does not expose a mode switch that leaves the Today brief unchanged', () => {
    expect(source).not.toContain('ModeToggle');
    expect(source).not.toContain('useMode');
  });

  it('shows the VE brand mark only below the small-screen breakpoint', () => {
    expect(source).toContain('aria-label="VouchEdge"');
    expect(source).toContain('text-vouch-emerald sm:hidden');
  });
});
