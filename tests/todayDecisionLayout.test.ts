import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  new URL('../src/components/TodayDashboard.tsx', import.meta.url),
  'utf8',
);

describe('Today decision-first layout', () => {
  it('leads with the real slate summary and compact briefing rail', () => {
    expect(source).toContain("buildTodayDecision({");
    expect(source).toContain('<TodayDecisionReel');
    expect(source).toContain("Today&apos;s Briefing");
    expect(source).toContain('Your edge in 60 seconds.');
    expect(source).toContain('Today slate status');
  });

  it('routes the six quick-access cards to canonical workspaces', () => {
    expect(source).toContain("section: 'hr_board'");
    expect(source).toContain("section: 'team_matchup_lab'");
    expect(source).toContain("section: 'daily_players'");
    expect(source).toContain("section: 'research'");
    expect(source).toContain("section: 'results'");
    expect(source).toContain("section: 'live_games'");
  });

  it('uses the shared touch-safe control contract', () => {
    expect(source).toContain('z8-control inline-flex min-h-9 items-center');
  });

  it('does not expose a mode switch that leaves the Today brief unchanged', () => {
    expect(source).not.toContain('ModeToggle');
    expect(source).not.toContain('useMode');
  });

  it('uses real slip and report data instead of simulated news or weather', () => {
    expect(source).toContain('pendingSlipList[0]');
    expect(source).toContain('Updates &amp; Impact');
    expect(source).toContain('Verified inputs only');
    expect(source).not.toContain('Trade rumor');
    expect(source).not.toContain('Weather update:');
  });

  it('shows the VE brand mark only below the small-screen breakpoint', () => {
    expect(source).toContain('aria-label="VouchEdge"');
    expect(source).toContain('text-vouch-emerald sm:hidden');
  });

  it('fits My Slips and Updates on mobile with safe-area padding and a tabbed desk', () => {
    expect(source).toContain('pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))]');
    expect(source).toContain('overflow-x-hidden');
    expect(source).toContain('role="tablist"');
    expect(source).toContain("mobileDeskTab === 'slips'");
    expect(source).toContain("mobileDeskTab === 'updates'");
    expect(source).toContain('hidden lg:block');
  });
});
