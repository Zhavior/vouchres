// @vitest-environment happy-dom

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HrNextMatchupSlider, type HrNextMatchupItem } from '../src/features/hr-next/components/HrNextMatchupSlider';

const mockMatchups: HrNextMatchupItem[] = [
  {
    id: 'LAD_vs_SD',
    awayTeam: 'LAD',
    homeTeam: 'SD',
    gameTime: '2026-08-15T23:10:00Z',
    count: 8,
  },
  {
    id: 'NYY_vs_BOS',
    awayTeam: 'NYY',
    homeTeam: 'BOS',
    gameTime: '2026-08-15T23:05:00Z',
    count: 6,
  },
  {
    id: 'ATL_vs_PHI',
    awayTeam: 'ATL',
    homeTeam: 'PHI',
    gameTime: '2026-08-15T22:40:00Z',
    count: 9,
  },
];

describe('HrNextMatchupSlider', () => {
  it('renders live matchups carousel with teams and counts', () => {
    const onSelectIndex = vi.fn();
    const onPrev = vi.fn();
    const onNext = vi.fn();

    render(
      <HrNextMatchupSlider
        matchups={mockMatchups}
        activeIndex={-1}
        onSelectIndex={onSelectIndex}
        onPrev={onPrev}
        onNext={onNext}
      />
    );

    expect(screen.getByText('All Games')).toBeTruthy();
    expect(screen.getByText('LAD')).toBeTruthy();
    expect(screen.getByText('SD')).toBeTruthy();
    expect(screen.getByText('NYY')).toBeTruthy();
    expect(screen.getByText('BOS')).toBeTruthy();
    expect(screen.getByText('ATL')).toBeTruthy();
    expect(screen.getByText('PHI')).toBeTruthy();
  });

  it('triggers onSelectIndex when clicking a matchup', () => {
    const onSelectIndex = vi.fn();
    const onPrev = vi.fn();
    const onNext = vi.fn();

    render(
      <HrNextMatchupSlider
        matchups={mockMatchups}
        activeIndex={0}
        onSelectIndex={onSelectIndex}
        onPrev={onPrev}
        onNext={onNext}
      />
    );

    fireEvent.click(screen.getByText('NYY'));
    expect(onSelectIndex).toHaveBeenCalledWith(1);
  });

  it('triggers prev and next navigation', () => {
    const onSelectIndex = vi.fn();
    const onPrev = vi.fn();
    const onNext = vi.fn();

    render(
      <HrNextMatchupSlider
        matchups={mockMatchups}
        activeIndex={0}
        onSelectIndex={onSelectIndex}
        onPrev={onPrev}
        onNext={onNext}
      />
    );

    fireEvent.click(screen.getByLabelText(/Previous Matchup/i));
    expect(onPrev).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText(/Next Matchup/i));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
