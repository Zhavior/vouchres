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
  it('elevates home runs when HR signal, price, weather, and vulnerable pitcher context are present', () => {
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
      subject: 'Test Hitter',
      bookLine: '+420 · 5.0%',
      modelProjection: '8.0%',
      deltaLabel: '+3.0 pts',
      modelValue: 8,
      marketValue: 5,
      scaleMax: 50,
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
      bookLine: 'Awaiting O/U K lines',
      deltaLabel: 'No line delta',
      direction: 'awaiting',
    });
    expect(summary.topMarket).toBeNull();
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

  it('surfaces the sportsbook HTTP state and keeps missing physical lanes locked', () => {
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
