import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  new URL('../src/components/TodayDashboardZ8.tsx', import.meta.url),
  'utf8',
);

describe('Today decision-first layout', () => {
  it('leads with the real slate summary and compact briefing rail', () => {
    expect(source).toContain('buildTodayDecision({');
    expect(source).toContain('<TodayDecisionReel');
    expect(source).toContain('Daily Intelligence Briefing');
    expect(source).toContain("isLoading ? 'Syncing' : isDegraded ? 'Partial data' : 'Live Sync Active'");
  });

  it('routes the quick-access cards to canonical workspaces', () => {
    expect(source).toContain("section: 'hr_board'");
    expect(source).toContain("section: 'team_matchup_lab'");
    expect(source).toContain("section: 'daily_players'");
    expect(source).toContain("section: 'research'");
    expect(source).toContain("section: 'results'");
    expect(source).toContain("section: 'live_games'");
  });

  it('uses touch-safe control sizing throughout', () => {
    // This file uses inline min-h-8/min-h-10 buttons directly rather than
    // the shared `z8-control` class (that class is still used by the child
    // TodayDecisionReel component this page renders) — both satisfy the
    // touch-target-size contract, just at different composition levels.
    expect(source).toContain('min-h-10 items-center');
    expect(source).toContain('min-h-8 shrink-0 items-center');
  });

  it('does not expose a mode switch that leaves the Today brief unchanged', () => {
    expect(source).not.toContain('ModeToggle');
    expect(source).not.toContain('useMode');
  });

  it('uses real slip and report data instead of simulated news or weather', () => {
    expect(source).toContain('pendingSlipList[0]');
    expect(source).not.toContain('Trade rumor');
    expect(source).not.toContain('Weather update:');
  });

  it('shows a compact VE brand mark in the sticky header', () => {
    expect(source).toContain('font-mono text-[10px] font-black text-vouch-emerald');
    expect(source).toMatch(/>\s*VE\s*<\/span>/);
  });
});
