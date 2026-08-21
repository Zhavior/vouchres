import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  new URL('../src/components/TodayDashboardZ8.tsx', import.meta.url),
  'utf8',
);
const auroraCss = readFileSync(
  new URL('../src/styles/aurora-max.css', import.meta.url),
  'utf8',
);
const fieldDeskSource = readFileSync(
  new URL('../src/components/today/TodayFieldDesk.tsx', import.meta.url),
  'utf8',
);
const todayNextShellSource = readFileSync(
  new URL('../src/features/today-next/components/TodayNextShell.tsx', import.meta.url),
  'utf8',
);
const todayCommandBriefSource = readFileSync(
  new URL('../src/features/today-next/components/TodayNextCommandBrief.tsx', import.meta.url),
  'utf8',
);
const todayMobileShellSource = readFileSync(
  new URL('../src/features/today-next/components/mobile/TodayMobileShell.tsx', import.meta.url),
  'utf8',
);

describe('Today decision-first layout & Command Desk', () => {
  it('leads with the real slate summary and connected field desk', () => {
    expect(source).toContain('buildTodayDecision({');
    expect(source).toContain('<TodayFieldDesk');
    expect(fieldDeskSource).toContain('title="Today\'s field desk"');
    expect(fieldDeskSource).toContain('Daily slate queue');
    expect(fieldDeskSource).toContain('setSelectedId(player.stableId)');
    expect(source).toContain("const statusLabel = isLoading ? 'Syncing sources' : decision.statusLabel");
    expect(source).toContain('id="today-data-status"');
  });

  it('falls back to active slate rows when confirmed lineups are unavailable', () => {
    expect(fieldDeskSource).toContain('confirmedRows.length > 0 ? confirmedRows : rows');
    expect(fieldDeskSource).toContain('Confirmed lineups unavailable — showing best available slate');
    expect(fieldDeskSource).not.toContain('No matchups match the active workspace filters');
  });

  it('uses the full Aura HQ Aurora Max field-desk composition', () => {
    expect(source).toContain('<AuroraMaxProductMark />');
    expect(source).toContain('title="Research command desk"');
    expect(source).toContain('<TodayFieldDesk');
    expect(source).toContain('Every row keeps its research receipt.');
    expect(source).toContain('today-resume-card');
    expect(source).toContain('title="Research tools"');
    expect(source).toContain('today-active-slip');
  });

  it('uses touch-safe control sizing throughout', () => {
    expect(fieldDeskSource).toContain('min-h-11');
    expect(fieldDeskSource).toContain('Spotlight');
  });

  it('does not expose a mode switch that leaves the Today brief unchanged', () => {
    expect(source).not.toContain('ModeToggle');
    expect(source).not.toContain('useMode');
  });

  it('uses real slip and report data instead of simulated news or weather', () => {
    expect(source).toContain('useDailyHrBoard');
    expect(source).toContain('openParlayAdd');
    expect(source).not.toContain('Trade rumor');
    expect(source).not.toContain('Weather update:');
  });

  it('renders the state-aware hero and truthful freshness contract', () => {
    expect(source).toContain("const heroState: TodayFieldState = isLoading");
    expect(source).toContain("? 'degraded'");
    expect(source).toContain("? 'no-slate'");
    expect(source).toContain("? 'live'");
    expect(source).toContain("? 'pregame'");
    expect(source).toContain(": 'postgame'");
    expect(source).toContain("return 'Update time unavailable'");
    expect(source).toContain("return 'Updated just now'");
  });

  it('renders the computed resume flow and routes it to the model destination', () => {
    expect(source).toContain('description={`Today’s VouchEdge slate · ${freshnessLabel}`}');
    expect(source).toContain('Every row keeps its research receipt.');
  });

  it('implements neobrutalist Stage 01 status and hard offset shadows on CTA', () => {
    expect(todayCommandBriefSource).toContain('STAGE 01: PRE-PITCH THESIS');
    expect(todayCommandBriefSource).toContain('shadow-[3px_3px_0px_0px_#00FF87]');
    expect(todayCommandBriefSource).toContain('Review HR Intelligence ->');
  });

  it('implements the mobile-first single-column ladder with sticky action hub', () => {
    expect(todayMobileShellSource).toContain('snap-x snap-mandatory');
    expect(todayMobileShellSource).toContain('⚡ SLIP');
  });

  it('refreshes both sources and removes nonessential motion when requested', () => {
    expect(source).toContain('Promise.all([dailyReportQuery.refetch(), hrBoardQuery.refresh()])');
    expect(source).toContain('aria-label="Refresh today\'s report and HR board"');
    expect(auroraCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(auroraCss).toContain('.aurora-max-shell');
    expect(auroraCss).toContain('.aurora-max-panel');
    expect(auroraCss).toContain('.aurora-max-control');
  });

  it('defers the personalization bundle until the user opens it', () => {
    expect(source).toContain("lazyWithRetry(() => import('./today/TodayPersonalizationPanel')");
    expect(source).toContain('<Suspense fallback=');
  });

  it('does not render a What changed digest', () => {
    expect(source).not.toContain('TodayChangeDigest');
    expect(source).not.toContain('useTodayChangeDigest');
    expect(source).not.toContain('What changed');
  });
});
