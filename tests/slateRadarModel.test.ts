import { describe, expect, it } from 'vitest';
import { buildSlateRadar } from '../src/components/slate-radar/slateRadarModel';
import type { HrWatchRow } from '../src/features/hr/types/hrWatch';
import type { DailyMlbReport } from '../src/types/mlb';

const baseReport: DailyMlbReport = {
  date: '2026-08-08',
  gameCount: 2,
  games: [
    {
      gamePk: 1,
      gameDate: '2026-08-08T23:05:00Z',
      status: 'Scheduled',
      awayTeam: { teamId: 1, name: 'Away', abbreviation: 'AWY' },
      homeTeam: { teamId: 2, name: 'Home', abbreviation: 'HME' },
      venue: 'Test Park',
      probablePitchers: {
        away: { pitcherId: 10, pitcherName: 'Away Arm', throws: 'R', team: 'AWY', teamId: 1 },
        home: { pitcherId: 20, pitcherName: 'Home Arm', throws: 'L', team: 'HME', teamId: 2 },
      },
      score: { away: 0, home: 0 },
      inning: null,
      dataQuality: 'full',
    },
    {
      gamePk: 2,
      gameDate: '2026-08-09T00:10:00Z',
      status: 'Scheduled',
      awayTeam: { teamId: 3, name: 'Other Away', abbreviation: 'OAW' },
      homeTeam: { teamId: 4, name: 'Other Home', abbreviation: 'OHM' },
      venue: 'Second Park',
      probablePitchers: { away: null, home: null },
      score: { away: 0, home: 0 },
      inning: null,
      dataQuality: 'partial',
    },
  ],
  vulnerablePitchers: [
    {
      pitcherId: 20,
      pitcherName: 'Home Arm',
      team: 'HME',
      opponent: 'AWY',
      throws: 'L',
      vulnerabilityScore: 88,
      riskTier: 'EXTREME',
      attackReasons: ['Allows barrels'],
      whatCouldGoWrong: ['Small sample'],
      dataQuality: 'full',
      recommendedMarkets: ['Home Runs'],
    },
  ],
  hrTargets: [],
  sneakyHr: [],
  runEnvironments: [
    {
      gamePk: 1,
      matchup: 'Away at Home',
      runEnvironmentScore: 82,
      tier: 'SHOOTOUT',
      reasons: ['Carry'],
      warnings: [],
      suggestedAngles: ['HR'],
    },
  ],
  dataQuality: 'full',
  generatedAt: '2026-08-08T15:00:00Z',
  disclaimer: 'Research only.',
};

function hrRow(overrides: Partial<HrWatchRow>): HrWatchRow {
  return {
    stableId: 'row-1',
    playerName: 'Test Hitter',
    playerId: 100,
    team: 'AWY',
    opponent: 'HME',
    teamLogoUrl: null,
    opponentLogoUrl: null,
    pitcherName: 'Home Arm',
    venue: 'Test Park',
    gamePk: 1,
    gameTime: null,
    headshotUrl: null,
    rank: 1,
    hrScore: 88,
    hitterPower: 90,
    pitcherVulnerability: 86,
    parkFactor: 82,
    parkContext: 84,
    parkIndex: 112,
    weather: 80,
    recentForm: 76,
    vouchScore: 70,
    dataConfidence: 88,
    truthStatus: 'official',
    riskTier: 'Elite',
    oddsLabel: '+420',
    bookOdds: 420,
    hrProbability: 0.08,
    impliedProbability: 0.05,
    recentHomeRuns: 2,
    recentHrGames: 10,
    recentGamesChecked: 15,
    reasons: ['Strong barrel form'],
    warnings: [],
    sourceMode: 'confirmed',
    ...overrides,
  };
}

describe('buildSlateRadar', () => {
  it('elevates the home-run market from aggregate MLB slate evidence', () => {
    const summary = buildSlateRadar({
      report: baseReport,
      hrRows: [
        hrRow({ stableId: 'row-1', hrScore: 90 }),
        hrRow({ stableId: 'row-2', playerName: 'Second Hitter', hrScore: 82 }),
        hrRow({ stableId: 'row-3', playerName: 'Third Hitter', hrScore: 74, riskTier: 'Core' }),
      ],
      loading: false,
      hasError: false,
    });

    expect(summary.topMarket?.id).toBe('home_runs');
    expect(summary.topMarket?.verdict).toBe('research');
    expect(summary.markets.find((market) => market.id === 'home_runs')?.confidence).toBeGreaterThan(70);
    expect(summary.topMarket?.marketEdges[0]).toMatchObject({
      subject: 'Home run market',
      bookLine: '3 confirmed hitters analyzed',
      modelProjection: '8.0% average among top 10',
      deltaLabel: 'SELECTIVE HRs',
      researchSignal: true,
    });
    expect(summary.topMarket?.physicalSplits[0]?.label).toBe('Starter susceptibility vs power');
    expect(summary.markets[0]?.id).toBe('home_runs');
  });

  it('caps Ks as monitor/selective because the full K projection contract is not available', () => {
    const summary = buildSlateRadar({
      report: baseReport,
      hrRows: [],
      loading: false,
      hasError: false,
    });

    const ks = summary.markets.find((market) => market.id === 'pitcher_ks');
    expect(ks?.confidence).toBeLessThanOrEqual(62);
    expect(ks?.cautions.join(' ')).toContain('opponent whiff');
    expect(ks?.marketEdges[0]).toMatchObject({
      bookLine: 'Awaiting probable-pitcher history',
      deltaLabel: 'No MLB target',
      direction: 'awaiting',
    });
    expect(summary.topMarket).toBeNull();
  });

  it('ranks market lanes instead of individual players when MLB research is available', () => {
    const summary = buildSlateRadar({
      report: baseReport,
      hrRows: [],
      loading: false,
      hasError: false,
      mlbResearch: {
        date: '2026-08-08',
        generatedAt: '2026-08-08T15:00:00Z',
        provider: { id: 'mlb_stats_api', status: 'live', eventCount: 2, signalCount: 4 },
        pitcherKs: [
          { subjectId: '10', subject: 'Away Arm', team: 'AWY', opponent: 'HME', seasonKPer9: 11.2, recentKAverage: 8.8, gamesStarted: 22, inningsPitched: 130 },
          { subjectId: '20', subject: 'Home Arm', team: 'HME', opponent: 'AWY', seasonKPer9: 10.8, recentKAverage: 8.2, gamesStarted: 21, inningsPitched: 126 },
        ],
        stolenBases: [
          { subjectId: '100', subject: 'Fast Runner', team: 'AWY', opponent: 'HME', estimatedProbability: 0.2, seasonStolenBases: 25, successRate: 0.82, attemptsPerGame: 0.3, lineupConfirmed: true },
          { subjectId: '200', subject: 'Other Runner', team: 'HME', opponent: 'AWY', estimatedProbability: 0.12, seasonStolenBases: 12, successRate: 0.75, attemptsPerGame: 0.18, lineupConfirmed: true },
        ],
        warnings: [],
      },
    });

    expect(summary.topMarket?.id).toBe('pitcher_ks');
    expect(summary.topMarket?.marketEdges).toHaveLength(1);
    expect(summary.topMarket?.marketEdges[0]).toMatchObject({
      subject: 'Pitcher strikeout market',
      bookLine: '2 probable starters analyzed',
      researchSignal: true,
    });
    expect(summary.topMarket?.marketEdges[0]?.subject).not.toContain('Away Arm');
  });

  it('does not return a top market when the report is unavailable', () => {
    const summary = buildSlateRadar({
      report: null,
      hrRows: [],
      loading: false,
      hasError: true,
    });

    expect(summary.slateState).toBe('unavailable');
    expect(summary.topMarket).toBeNull();
    expect(summary.dataWarnings[0]).toContain('Daily report failed');
  });

  it('surfaces the MLB HTTP state and keeps missing physical lanes locked', () => {
    const summary = buildSlateRadar({
      report: baseReport,
      hrRows: [],
      loading: false,
      hasError: false,
      marketRadarError: '502 upstream_unavailable · request req-123',
    });

    expect(summary.provider).toMatchObject({ status: 'error' });
    expect(summary.dataWarnings.join(' ')).toContain('502 upstream_unavailable');
    expect(summary.markets.find((market) => market.id === 'stolen_bases')?.physicalSplits[0]).toMatchObject({
      leftScore: null,
      rightScore: null,
    });
  });
});
