import { describe, expect, it } from 'vitest';
import type { ApiGame, DailyMlbReport } from '../src/types/mlb';
import { buildTodayDecision } from '../src/components/today/todayDecisionModel';

function game(status: string): ApiGame {
  return {
    gamePk: Math.floor(Math.random() * 100_000),
    gameDate: '2026-07-16T23:00:00Z',
    status,
    awayTeam: { teamId: 1, name: 'Away', abbreviation: 'AWY' },
    homeTeam: { teamId: 2, name: 'Home', abbreviation: 'HME' },
    venue: 'Test Park',
    probablePitchers: { away: null, home: null },
    score: { away: 0, home: 0 },
    inning: null,
    dataQuality: 'full',
  };
}

function report(overrides: Partial<DailyMlbReport> = {}): DailyMlbReport {
  return {
    date: '2026-07-16',
    gameCount: 2,
    games: [game('Scheduled'), game('Scheduled')],
    vulnerablePitchers: [],
    hrTargets: [],
    sneakyHr: [],
    runEnvironments: [],
    dataQuality: 'full',
    generatedAt: '2026-07-16T12:00:00Z',
    disclaimer: 'Research only.',
    ...overrides,
  };
}

const baseInput = {
  loading: false,
  hasError: false,
  savedSlips: 0,
  pendingSlips: 0,
  hrSignalCount: 0,
  hrSignalsLoading: false,
};

describe('buildTodayDecision', () => {
  it('prioritizes unresolved saved slips over live games', () => {
    const decision = buildTodayDecision({
      ...baseInput,
      report: report({ gameCount: 1, games: [game('In Progress')] }),
      savedSlips: 2,
      pendingSlips: 2,
    });

    expect(decision.ctaSection).toBe('live_parlays');
    expect(decision.title).toContain('2 saved slips');
    expect(decision.liveGames).toBe(1);
  });

  it('routes to live games when the slate is underway and no slip needs review', () => {
    const decision = buildTodayDecision({
      ...baseInput,
      report: report({ gameCount: 2, games: [game('Live'), game('Final')] }),
    });

    expect(decision.ctaSection).toBe('live_games');
    expect(decision.liveGames).toBe(1);
    expect(decision.finalGames).toBe(1);
    expect(decision.statusLabel).toBe('Report complete');
  });

  it('routes a ready research report to the full HR board without claiming confirmed lineups', () => {
    const decision = buildTodayDecision({
      ...baseInput,
      report: report({
        dataQuality: 'partial',
        hrTargets: [{
          targetId: 'target-1',
          team: 'NYY',
          opponent: 'BOS',
          opposingPitcher: 'Pitcher',
          opposingPitcherId: 123,
          hrScore: 81,
          tier: 'Strong',
          label: 'Strong',
          reasons: ['Power matchup'],
          riskWarnings: ['Lineup unconfirmed'],
          confidence: 'Moderate',
          judgeStatus: 'Pending',
          dataQuality: 'partial',
        }],
      }),
      hrSignalCount: 4,
    });

    expect(decision.ctaSection).toBe('hr_board');
    expect(decision.title).toContain('available');
    expect(decision.description).toContain('4 research signals');
    expect(decision.attention[2]?.value).toBe('4 signals available');
    expect(decision.description.toLowerCase()).not.toContain('confirmed');
    expect(decision.statusLabel).toBe('Partial data');
  });

  it('does not borrow a signal count from the daily report while the canonical board is syncing', () => {
    const decision = buildTodayDecision({
      ...baseInput,
      report: report({
        hrTargets: [{
          targetId: 'report-only-target',
          team: 'NYY',
          opponent: 'BOS',
          opposingPitcher: 'Pitcher',
          opposingPitcherId: 123,
          hrScore: 81,
          tier: 'Strong',
          label: 'Strong',
          reasons: ['Power matchup'],
          riskWarnings: [],
          confidence: 'Moderate',
          judgeStatus: 'Pending',
          dataQuality: 'partial',
        }],
      }),
      hrSignalCount: null,
      hrSignalsLoading: true,
    });

    expect(decision.title).toContain('syncing');
    expect(decision.attention[2]?.value).toBe('Board syncing');
    expect(decision.description).not.toContain('1 research signal');
  });

  it('does not invent a slate when the daily report fails', () => {
    const decision = buildTodayDecision({
      ...baseInput,
      report: null,
      hasError: true,
    });

    expect(decision.statusLabel).toBe('Degraded');
    expect(decision.title).toContain('limited');
    expect(decision.attention).toHaveLength(3);
    expect(decision.attention[0]?.value).toBe('Daily brief unavailable');
  });

  it('recommends the ledger rather than forcing action on a no-games day', () => {
    const decision = buildTodayDecision({
      ...baseInput,
      report: report({ gameCount: 0, games: [] }),
    });

    expect(decision.ctaSection).toBe('results');
    expect(decision.title).toContain('No MLB games');
  });
});
