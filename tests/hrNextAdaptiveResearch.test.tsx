// @vitest-environment happy-dom

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HrNextResearchView } from '../src/features/hr-next/components/HrNextResearchView';

const mockResearchData = {
  player: {
    id: 660271,
    name: 'Shohei Ohtani',
    team: 'LAD',
    bats: 'L',
    headshotUrl: null,
    teamLogoUrl: null,
    lineupStatus: 'confirmed',
    lineupPosition: 1,
  },
  matchup: {
    gamePk: 12345,
    opponent: 'SD',
    opponentLogoUrl: null,
    venue: 'Dodger Stadium',
    gameTime: '2026-08-15T23:10:00Z',
    pitcher: {
      id: 999,
      name: 'Dylan Cease',
      throws: 'R',
    },
  },
  decision: {
    hrScore: 94.2,
    modelProbability: 0.28,
    marketProbability: 0.22,
    fairOddsAmerican: 250,
    marketOddsAmerican: 320,
    playableAtOrAbove: 270,
    edgePercentagePoints: 6.0,
    confidence: 'high',
    verdict: 'strong',
    summary: 'Elite power profile against right-handed slider-heavy starter.',
  },
  reasons: [
    {
      key: 'pitch_matchup',
      label: 'Crushing Fastball & Slider',
      explanation: 'Over .650 xSLG against primary arsenal.',
      direction: 'positive',
      value: 0.65,
      displayValue: '.650 xSLG',
      sampleSize: 45,
      source: 'Statcast',
    },
  ],
  risks: [
    {
      key: 'strikeout_risk',
      label: 'Elevated Whiff Profile',
      explanation: 'Cease generates 31% whiff rate on slider.',
      direction: 'negative',
      value: 0.31,
      displayValue: '31%',
      sampleSize: 60,
      source: 'Statcast',
    },
  ],
  charts: {
    signalTimeline: [],
    contactQuality: [],
    pitchArsenal: [
      {
        pitchType: 'FF',
        pitchName: '4-Seam Fastball',
        pitcherUsage: 0.45,
        batterAverage: 0.31,
        batterSlugging: 0.68,
        batterExpectedSlugging: 0.685,
        batterWhiffRate: 0.16,
        runValue: 8,
        matchupScore: 88,
        sampleSize: 40,
      },
    ],
    pitcherVulnerability: [
      {
        date: '2026-08-01',
        opponent: 'ARI',
        inningsPitched: 5.2,
        homeRunsAllowed: 2,
        hardHitRateAllowed: 0.42,
        barrelRateAllowed: 0.12,
        flyBallRateAllowed: 0.38,
        averageExitVelocityAllowed: 91.2,
        fastballVelocity: 97.4,
      },
    ],
    sprayEvents: [
      {
        id: 'barrel-1',
        date: '2026-08-10',
        x: 120,
        y: 80,
        result: 'home_run',
        exitVelocity: 114.5,
        launchAngle: 28,
        distance: 440,
        isHomeRun: true,
      },
    ],
    scoreContributions: [],
    oddsHistory: [
      {
        capturedAt: '2026-08-15T18:00:00Z',
        sportsbook: 'DraftKings',
        americanOdds: 320,
        impliedProbability: 0.238,
      },
    ],
  },
  context: {
    seasonStats: {},
    rolling14Day: null,
    batterVsPitcher: {
      ab: 12,
      h: 4,
      hr: 2,
      ops: 1.25,
    },
    weather: {
      temp: 78,
      windSpeed: 9,
      windDirection: 'Out to CF',
    },
  },
  quality: {
    status: 'complete',
    dataConfidence: 95,
    truthStatus: 'official',
    dataSource: 'MLB Statcast',
    modelVersion: 'v2.1',
    generatedAt: '2026-08-15T20:00:00Z',
    updatedAt: '2026-08-15T20:00:00Z',
    missingFields: [],
    warnings: [],
  },
};

// Mock fetch globally
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true, research: mockResearchData }),
  }));
});

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('HrNextResearchView', () => {
  it('renders research telemetry header with player name and score', async () => {
    const onClose = vi.fn();
    renderWithClient(
      <HrNextResearchView
        playerId={660271}
        playerName="Shohei Ohtani"
        mode="dock"
        onClose={onClose}
      />
    );

    expect(screen.getByText('Shohei Ohtani')).toBeTruthy();
    expect(screen.getByText(/DEEP INTEL TELEMETRY/i)).toBeTruthy();

    const hrScoreElement = await screen.findByText('94.2');
    expect(hrScoreElement).toBeTruthy();
  });

  it('allows switching across telemetry tabs', async () => {
    renderWithClient(
      <HrNextResearchView
        playerId={660271}
        playerName="Shohei Ohtani"
        mode="dock"
        onClose={vi.fn()}
      />
    );

    // Default tab is Arsenal & Matchup
    const fastballs = await screen.findAllByText(/4-Seam Fastball/i);
    expect(fastballs.length).toBeGreaterThan(0);

    // Switch to Park & 3D Field tab
    fireEvent.click(screen.getByRole('button', { name: /Park & 3D Field/i }));
    expect(await screen.findByText(/Statcast Peak Contact Quality/i)).toBeTruthy();
    expect(await screen.findByText(/114.5 mph/i)).toBeTruthy();

    // Switch to Starter & Bullpen tab
    fireEvent.click(screen.getByRole('button', { name: /Starter & Bullpen/i }));
    expect(await screen.findByText(/Dylan Cease/i)).toBeTruthy();
    expect(await screen.findByText(/97.4 mph Fastball/i)).toBeTruthy();

    // Switch to Odds & EV tab
    fireEvent.click(screen.getByRole('button', { name: /Odds & EV/i }));
    expect(await screen.findByText(/Fair Market Line Shopping Matrix/i)).toBeTruthy();
    expect(await screen.findByText('+250')).toBeTruthy();
    const plus320Elements = await screen.findAllByText('+320');
    expect(plus320Elements.length).toBeGreaterThan(0);

    // Switch to Form & Trends tab
    fireEvent.click(screen.getByRole('button', { name: /Form & Trends/i }));
    expect(await screen.findByText(/Recent 10-Game Production Wave/i)).toBeTruthy();

    // Switch to Model Read tab
    fireEvent.click(screen.getByRole('button', { name: /Model Read/i }));
    expect(await screen.findByText(/AI Engine Decision Rationale/i)).toBeTruthy();
    expect(await screen.findByText(/Crushing Fastball & Slider/i)).toBeTruthy();
  });

  it('triggers onClose when close button is pressed', async () => {
    const onClose = vi.fn();
    renderWithClient(
      <HrNextResearchView
        playerId={660271}
        playerName="Shohei Ohtani"
        mode="topbar"
        onClose={onClose}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /Close research panel/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
