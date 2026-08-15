import { describe, expect, it } from 'vitest';
import type { HrWatchRow } from '../src/features/hr/types/hrWatch';
import type { ApiGame, DailyMlbReport } from '../src/types/mlb';
import { buildTodayDecision } from '../src/components/today/todayDecisionModel';
import { buildTodayReelSlides } from '../src/components/today/todayDecisionReelModel';

function game(status = 'Scheduled'): ApiGame {
  return {
    gamePk: 101,
    gameDate: '2026-07-16T23:10:00Z',
    status,
    awayTeam: { teamId: 147, name: 'New York Yankees', abbreviation: 'NYY' },
    homeTeam: { teamId: 111, name: 'Boston Red Sox', abbreviation: 'BOS' },
    venue: 'Fenway Park',
    probablePitchers: { away: null, home: null },
    score: { away: 0, home: 0 },
    inning: null,
    dataQuality: 'full',
  };
}

function report(): DailyMlbReport {
  return {
    date: '2026-07-16',
    gameCount: 1,
    games: [game()],
    vulnerablePitchers: [{
      pitcherId: 456,
      pitcherName: 'Test Pitcher',
      team: 'Boston Red Sox',
      opponent: 'New York Yankees',
      throws: 'R',
      vulnerabilityScore: 82,
      riskTier: 'HIGH',
      attackReasons: ['Allows elevated contact.'],
      whatCouldGoWrong: ['Recent sample is limited.'],
      dataQuality: 'full',
      recommendedMarkets: [],
    }],
    hrTargets: [],
    sneakyHr: [],
    runEnvironments: [{
      gamePk: 101,
      matchup: 'NYY @ BOS',
      runEnvironmentScore: 78,
      tier: 'HIGH',
      reasons: ['Park context supports scoring.'],
      warnings: ['Weather can change.'],
      suggestedAngles: [],
    }],
    dataQuality: 'full',
    generatedAt: '2026-07-16T12:00:00Z',
    disclaimer: 'Research only.',
  };
}

function player(truthStatus: HrWatchRow['truthStatus'] = 'projected'): HrWatchRow {
  return {
    stableId: '101-123-NYY',
    playerName: 'Test Hitter',
    playerId: 123,
    team: 'NYY',
    opponent: 'BOS',
    teamLogoUrl: null,
    opponentLogoUrl: null,
    pitcherName: 'Test Pitcher',
    venue: 'Fenway Park',
    gamePk: 101,
    gameTime: '7:10 PM',
    headshotUrl: null,
    rank: 1,
    hrScore: 88,
    hitterPower: 91,
    pitcherVulnerability: 82,
    parkFactor: 104,
    recentForm: 74,
    vouchScore: null,
    dataConfidence: 80,
    truthStatus,
    riskTier: 'Elite',
    oddsLabel: 'Odds TBD',
    reasons: ['Barrel quality supports the signal.'],
    warnings: ['Lineup is not official.'],
    sourceMode: truthStatus === 'official' ? 'confirmed' : 'curated',
  };
}

describe('buildTodayReelSlides', () => {
  it('leads with a real player and retains the state-based decision', () => {
    const dailyReport = report();
    const decision = buildTodayDecision({
      report: dailyReport,
      loading: false,
      hasError: false,
      savedSlips: 0,
      pendingSlips: 0,
      hrSignalCount: 1,
      hrSignalsLoading: false,
    });
    const slides = buildTodayReelSlides({ decision, report: dailyReport, topPlayer: player() });

    expect(slides.map((slide) => slide.id)).toEqual(['hr-player', 'decision', 'run-environment', 'pitcher']);
    expect(slides[0]?.ctaSection).toBe('hr_board');
    expect(slides[1]?.ctaSection).toBe(decision.ctaSection);
    expect(slides[3]?.visual.type).toBe('signal');
  });

  it('labels projected players honestly and does not call the run environment a bet', () => {
    const dailyReport = report();
    const decision = buildTodayDecision({
      report: dailyReport,
      loading: false,
      hasError: false,
      savedSlips: 0,
      pendingSlips: 0,
      hrSignalCount: 1,
      hrSignalsLoading: false,
    });
    const slides = buildTodayReelSlides({ decision, report: dailyReport, topPlayer: player('projected') });
    const hrSlide = slides.find((slide) => slide.id === 'hr-player');
    const runSlide = slides.find((slide) => slide.id === 'run-environment');

    expect(hrSlide?.kicker).toBe('Projected HR signal');
    expect(hrSlide?.risk).toContain('Lineup is not official');
    expect(`${runSlide?.kicker} ${runSlide?.title} ${runSlide?.description}`.toLowerCase()).not.toContain('best bet');
  });

  it('falls back to one useful decision slide when optional research is unavailable', () => {
    const decision = buildTodayDecision({
      report: null,
      loading: false,
      hasError: true,
      savedSlips: 0,
      pendingSlips: 0,
      hrSignalCount: null,
      hrSignalsLoading: false,
    });
    const slides = buildTodayReelSlides({ decision, report: null, topPlayer: null });

    expect(slides).toHaveLength(1);
    expect(slides[0]?.id).toBe('decision');
    expect(slides[0]?.visual.type).toBe('signal');
  });
});
