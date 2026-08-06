import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  new URL('../src/components/TodayDashboardZ8.tsx', import.meta.url),
  'utf8',
);
const auroraCss = readFileSync(
  new URL('../src/styles/today-aurora.css', import.meta.url),
  'utf8',
);

describe('Today decision-first layout', () => {
  it('leads with the real slate summary and compact briefing rail', () => {
    expect(source).toContain('buildTodayDecision({');
    expect(source).toContain('<TodayAuroraHero');
    expect(source).toContain('<TodayDecisionReel');
    expect(source).toContain('Daily Intelligence Briefing');
    expect(source).toContain("const statusLabel = isLoading ? 'Syncing sources' : decision.statusLabel");
    expect(source).toContain('id="today-data-status"');
  });

  it('routes the four focused workflow cards to canonical workspaces', () => {
    expect(source).toContain("section: 'hr_board'");
    expect(source).toContain("section: 'research'");
    expect(source).toContain("section: 'results'");
    expect(source).toContain("section: 'build'");
    expect(source).toContain('4 Core Actions');
    expect(source).not.toContain('8 Core Systems');
  });

  it('uses touch-safe control sizing throughout', () => {
    // This file uses inline min-h-8/min-h-11 buttons directly rather than
    // the shared `z8-control` class (that class is still used by the child
    // TodayDecisionReel component this page renders) — both satisfy the
    // touch-target-size contract, just at different composition levels.
    expect(source).toContain('min-h-16 flex-col items-center');
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

  it('renders the state-aware hero and truthful freshness contract', () => {
    expect(source).toContain("const heroState: TodayHeroState = isLoading");
    expect(source).toContain("? 'degraded'");
    expect(source).toContain("? 'no-slate'");
    expect(source).toContain("? 'live'");
    expect(source).toContain("? 'pregame'");
    expect(source).toContain(": 'postgame'");
    expect(source).toContain("return 'Update time unavailable'");
    expect(source).toContain("return 'Updated just now'");
  });

  it('matches the hero visual to wherever the decision is sending the user', () => {
    // A saved favourite team used to force the generic decision slide, hiding
    // the ranked player behind "N MLB games are live".
    expect(source).toContain("decision.ctaSection === 'hr_board'");
    expect(source).toContain("reelSlides.find((slide) => slide.id === 'hr-player')");
    expect(source).not.toContain('preferences.favoriteMlbTeamIds.length > 0');
  });

  it('feeds the fresh live board into the decision so the count is not stale', () => {
    expect(source).toContain('liveGameCards: liveGames');
  });

  it('renders the computed resume flow and routes it to the model destination', () => {
    expect(source).toContain('id="today-resume-card"');
    expect(source).toContain('data-testid="today-resume-action"');
    expect(source).toContain('decision.resumeLabel');
    expect(source).toContain('decision.resumeTitle');
    expect(source).toContain('decision.resumeDetail');
    expect(source).toContain("onSectionChange(decision.resumeSection)");
  });

  it('uses a mobile 2x2 layout for stats and canonical quick actions', () => {
    expect(source).toContain('grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3');
    expect(source).toContain('grid grid-cols-2 gap-2 sm:grid-cols-4');
    expect(source).toContain('data-testid={`today-quick-route-${route.section}`}');
  });

  it('refreshes both sources and removes nonessential motion when requested', () => {
    expect(source).toContain('Promise.all([dailyReportQuery.refetch(), hrBoardQuery.refresh()])');
    expect(source).toContain('aria-label="Refresh today\'s report and HR board"');
    expect(auroraCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(auroraCss).toContain('.today-aurora-orbit--loading');
    expect(auroraCss).toContain('animation: none !important');
    expect(auroraCss).toContain('.today-aurora-primary:hover { transform: none; }');
  });
});
