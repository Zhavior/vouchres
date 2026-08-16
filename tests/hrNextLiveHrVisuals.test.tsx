// @vitest-environment happy-dom

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HrNextCard } from '../src/features/hr-next/components/HrNextCard';
import { getHrHitStatus } from '../src/features/hr-next/utils/cardUtils';
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
    recentHomeRuns: 0,
    recentHrGames: 0,
    recentGamesChecked: 7,
    vouchScore: 9,
    dataConfidence: 95,
    truthStatus: 'official',
    riskTier: 'Elite',
    oddsLabel: '+280',
    hrProbability: 0.28,
    impliedProbability: 0.22,
    reasons: ['Elite power'],
    warnings: [],
    sourceMode: 'curated',
    ...overrides,
  };
}

describe('HrNext Live HR Visuals & Tiering', () => {
  it('correctly classifies 0 HR, 1 HR (single/yellow), and 2+ HR (multi/bronze)', () => {
    const zeroHr = makeMockRow({ recentHomeRuns: 0 });
    expect(getHrHitStatus(zeroHr).tier).toBe('none');

    const singleHr = makeMockRow({ recentHomeRuns: 1 });
    expect(getHrHitStatus(singleHr).tier).toBe('single');
    expect(getHrHitStatus(singleHr).badgeLabel).toBe('1 HR');

    const multiHr = makeMockRow({ recentHomeRuns: 2 });
    expect(getHrHitStatus(multiHr).tier).toBe('multi');
    expect(getHrHitStatus(multiHr).badgeLabel).toBe('2x HR');
  });

  it('renders Yellow styling and 1 HR badge for single home run', () => {
    const singleHrRow = makeMockRow({ recentHomeRuns: 1 });

    render(
      <HrNextCard
        row={singleHrRow}
        active={false}
        saved={false}
        isReceiptOpen={false}
        onSelect={vi.fn()}
        onToggleSaved={vi.fn()}
        onAddToSlip={vi.fn()}
      />
    );

    const card = screen.getByTestId('hr-card-shohei-ohtani');
    expect(card.getAttribute('data-hr-tier')).toBe('single');
    expect(card.className).toContain('border-amber-400');
    expect(screen.getByText(/1 HR/i)).toBeTruthy();
  });

  it('renders Bronze styling and 2x HR badge for multi-home run performers', () => {
    const multiHrRow = makeMockRow({ recentHomeRuns: 2 });

    render(
      <HrNextCard
        row={multiHrRow}
        active={false}
        saved={false}
        isReceiptOpen={false}
        onSelect={vi.fn()}
        onToggleSaved={vi.fn()}
        onAddToSlip={vi.fn()}
      />
    );

    const card = screen.getByTestId('hr-card-shohei-ohtani');
    expect(card.getAttribute('data-hr-tier')).toBe('multi');
    expect(card.className).toContain('border-[#cd7f32]');
    expect(screen.getByText(/2x HR/i)).toBeTruthy();
  });
});
