// @vitest-environment happy-dom

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HrNextTacticalFilters } from '../src/features/hr-next/components/HrNextTacticalFilters';
import { HrNextKeyboardCheatsheet } from '../src/features/hr-next/components/HrNextKeyboardCheatsheet';
import { matchesTacticalFilter } from '../src/features/hr-next/hooks/useHrNextData';
import type { HrWatchRow } from '../src/features/hr/types/hrWatch';

function makeMockRow(overrides: Partial<HrWatchRow> = {}): HrWatchRow {
  return {
    stableId: 'shohei-ohtani',
    playerName: 'Shohei Ohtani',
    playerId: 660271,
    team: 'LAD',
    opponent: 'SD',
    teamLogoUrl: null,
    opponentLogoUrl: null,
    pitcherName: 'Dylan Cease',
    venue: 'Dodger Stadium',
    gamePk: 10,
    gameTime: '2026-08-15T23:00:00Z',
    headshotUrl: null,
    rank: 1,
    hrScore: 94,
    hitterPower: 95,
    pitcherVulnerability: 74,
    parkFactor: 108,
    recentForm: 90,
    recentHomeRuns: 2,
    recentHrGames: 2,
    recentGamesChecked: 7,
    vouchScore: 9,
    dataConfidence: 95,
    truthStatus: 'official',
    riskTier: 'Elite',
    oddsLabel: '+280',
    hrProbability: 0.28,
    impliedProbability: 0.22,
    reasons: ['Elite power against slider', 'Wind blowing out 9mph'],
    warnings: [],
    sourceMode: 'curated',
    ...overrides,
  };
}

describe('HrNextTacticalFilters', () => {
  it('renders all tactical filter chips with counts', () => {
    const counts = {
      all: 36,
      hot: 12,
      high_ev: 8,
      wind_out: 5,
      vulnerable_sp: 14,
      platoon: 16,
    };
    const onTagChange = vi.fn();

    render(
      <HrNextTacticalFilters
        activeTag="all"
        onTagChange={onTagChange}
        counts={counts}
      />
    );

    expect(screen.getByText('All Radar')).toBeTruthy();
    expect(screen.getByText('36')).toBeTruthy();
    expect(screen.getByText('Hot Streaks')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('High EV Edge')).toBeTruthy();
    expect(screen.getByText('8')).toBeTruthy();
    expect(screen.getByText('Wind Out Alert')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();

    fireEvent.click(screen.getByText('Hot Streaks'));
    expect(onTagChange).toHaveBeenCalledWith('hot');
  });

  it('correctly matches tactical filters against player rows', () => {
    const hotRow = makeMockRow({ recentHomeRuns: 2 });
    const coldRow = makeMockRow({ recentHomeRuns: 0, recentForm: 40 });

    expect(matchesTacticalFilter(hotRow, 'hot')).toBe(true);
    expect(matchesTacticalFilter(coldRow, 'hot')).toBe(false);

    const highEvRow = makeMockRow({ hrProbability: 0.35, impliedProbability: 0.25 });
    expect(matchesTacticalFilter(highEvRow, 'high_ev')).toBe(true);

    const windRow = makeMockRow({ parkFactor: 110 });
    expect(matchesTacticalFilter(windRow, 'wind_out')).toBe(true);

    const vulnerableSpRow = makeMockRow({ pitcherVulnerability: 80 });
    expect(matchesTacticalFilter(vulnerableSpRow, 'vulnerable_sp')).toBe(true);
  });
});

describe('HrNextKeyboardCheatsheet', () => {
  it('renders keybindings cheatsheet when open', () => {
    const onClose = vi.fn();
    render(<HrNextKeyboardCheatsheet isOpen={true} onClose={onClose} />);

    expect(screen.getByText('Terminal Keybindings')).toBeTruthy();
    expect(screen.getByText('J / ↓')).toBeTruthy();
    expect(screen.getByText('Space / Enter')).toBeTruthy();
    expect(screen.getByText('S')).toBeTruthy();
    expect(screen.getByText('F')).toBeTruthy();
  });
});
