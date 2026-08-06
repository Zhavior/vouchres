import { describe, expect, it } from 'vitest';
import type { ApiGame, DailyMlbReport } from '../src/types/mlb';
import type { LiveGameCard } from '../src/types/liveGames';
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


function liveCard(overrides: Partial<LiveGameCard> & { id: string }): LiveGameCard {
  return {
    homeTeam: 'Home', awayTeam: 'Away', homeAbbr: 'HOM', awayAbbr: 'AWY',
    homeTeamId: 1, awayTeamId: 2, homeScore: 0, awayScore: 0,
    status: 'Scheduled', venue: null, gameDate: null, inning: null,
    halfInning: null, outs: null, liveStateLabel: null, feedAsOf: null,
    ...overrides,
  };
}

describe('buildTodayDecision', () => {
  it('counts live games from the fresh board when the daily report snapshot lags', () => {
    // Reproduces the real slate: the report still had WSH @ PHI as "Warmup"
    // while the live feed had already flipped it to In Progress, so the hero
    // announced one live game next to a Live Games page showing two.
    const staleReport = report();
    staleReport.gameCount = 11;
    staleReport.games = [
      { ...game('In Progress'), gamePk: 1 },
      { ...game('Warmup'), gamePk: 2 },
    ];

    const decision = buildTodayDecision({
      report: staleReport,
      loading: false,
      hasError: false,
      savedSlips: 0,
      pendingSlips: 0,
      hrSignalCount: 3,
      hrSignalsLoading: false,
      liveGameCards: [
        liveCard({ id: '1', status: 'In Progress', isLive: true }),
        liveCard({ id: '2', status: 'In Progress', isLive: true }),
        liveCard({ id: '3', status: 'Final', isFinal: true }),
        liveCard({ id: '4', status: 'Pre-Game' }),
      ],
    });

    expect(decision.liveGames).toBe(2);
    expect(decision.finalGames).toBe(1);
    // The report alone would have said 1. The slate line is what the user sees.
    expect(decision.attention.find((item) => item.id === 'slate-status')?.detail).toContain('2 live');
  });

  it('falls back to card status strings when the live flags are absent', () => {
    const decision = buildTodayDecision({
      report: report(),
      loading: false,
      hasError: false,
      savedSlips: 0,
      pendingSlips: 0,
      hrSignalCount: 3,
      hrSignalsLoading: false,
      liveGameCards: [
        liveCard({ id: '1', status: 'In Progress' }),
        liveCard({ id: '2', status: 'Final' }),
      ],
    });

    expect(decision.liveGames).toBe(1);
    expect(decision.finalGames).toBe(1);
  });

  it('still reads the report when no live board is supplied', () => {
    const decision = buildTodayDecision({
      report: report(),
      loading: false,
      hasError: false,
      savedSlips: 0,
      pendingSlips: 0,
      hrSignalCount: 3,
      hrSignalsLoading: false,
    });

    expect(decision.liveGames).toBe(0);
  });

  it('keeps recommending research while part of the slate is still upcoming', () => {
    // 2 live, 4 upcoming, board full of signals: first pitch somewhere must not
    // turn the whole page into slate status.
    const decision = buildTodayDecision({
      ...baseInput,
      report: report({ gameCount: 6, games: [game('In Progress'), game('In Progress')] }),
      hrSignalCount: 120,
      liveGameCards: [
        liveCard({ id: '1', status: 'In Progress', isLive: true }),
        liveCard({ id: '2', status: 'In Progress', isLive: true }),
        liveCard({ id: '3', status: 'Pre-Game' }),
        liveCard({ id: '4', status: 'Pre-Game' }),
        liveCard({ id: '5', status: 'Pre-Game' }),
        liveCard({ id: '6', status: 'Pre-Game' }),
      ],
    });

    expect(decision.ctaSection).toBe('hr_board');
    expect(decision.title).toBe("Today's HR research board is available");
    expect(decision.description).toContain('2 games are already underway');
    expect(decision.description).toContain('4 still have not started');
  });

  it('switches to live tracking once nothing is left to research', () => {
    const decision = buildTodayDecision({
      ...baseInput,
      report: report({ gameCount: 2, games: [game('In Progress'), game('Final')] }),
      hrSignalCount: 120,
      liveGameCards: [
        liveCard({ id: '1', status: 'In Progress', isLive: true }),
        liveCard({ id: '2', status: 'Final', isFinal: true }),
      ],
    });

    expect(decision.ctaSection).toBe('live_games');
    expect(decision.title).toBe('1 MLB game is live');
  });

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

  it('resumes unresolved slips before starting new research', () => {
    const decision = buildTodayDecision({
      ...baseInput,
      report: report(),
      savedSlips: 3,
      pendingSlips: 2,
    });

    expect(decision.resumeLabel).toBe('Continue tracking');
    expect(decision.resumeTitle).toBe('2 unresolved slips');
    expect(decision.resumeSection).toBe('live_parlays');
  });

  it('resumes the verified record when saved work exists without a pending slip', () => {
    const decision = buildTodayDecision({
      ...baseInput,
      report: report(),
      savedSlips: 4,
    });

    expect(decision.resumeLabel).toBe('Continue your record');
    expect(decision.resumeTitle).toBe('4 saved slips');
    expect(decision.resumeSection).toBe('results');
  });

  it('starts a new user in research without fabricating prior activity', () => {
    const decision = buildTodayDecision({
      ...baseInput,
      report: report(),
    });

    expect(decision.resumeLabel).toBe('Start the daily loop');
    expect(decision.resumeTitle).toBe('Research one decision deeply');
    expect(decision.resumeSection).toBe('hr_board');
    expect(decision.resumeDetail.toLowerCase()).not.toContain('saved');
  });

  it('reports limited source quality without claiming a complete or live sync', () => {
    const decision = buildTodayDecision({
      ...baseInput,
      report: report({ dataQuality: 'limited' }),
      hrSignalCount: 1,
    });

    expect(decision.statusLabel).toBe('Limited data');
    expect(decision.attention[0]).toMatchObject({
      id: 'data-quality',
      value: 'Research is incomplete',
    });
    expect(decision.attention[0]?.detail.toLowerCase()).toContain('preliminary');
  });
});
