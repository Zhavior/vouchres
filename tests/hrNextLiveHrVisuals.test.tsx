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

describe('HrNext Today-Only Live HR Visuals & Tiering', () => {
  it('does NOT trigger yellow/bronze card for past historical HRs alone', () => {
    // Player hit 2 HRs in their previous games, but 0 today
    const pastHrOnly = makeMockRow({ recentHomeRuns: 2 });
    expect(getHrHitStatus(pastHrOnly).tier).toBe('none');

    render(
      <HrNextCard
        row={pastHrOnly}
        active={false}
        saved={false}
        isReceiptOpen={false}
        onSelect={vi.fn()}
        onToggleSaved={vi.fn()}
        onAddToSlip={vi.fn()}
      />
    );

    const card = screen.getByTestId('hr-card-shohei-ohtani');
    expect(card.getAttribute('data-hr-tier')).toBe('none');
    expect(card.className).not.toContain('border-amber-400');
    expect(card.className).not.toContain('border-[#cd7f32]');
  });

  it('renders Yellow styling and HR TODAY badge when player hits 1 HR today', () => {
    const singleHrTodayRow = makeMockRow({
      raw: { liveHomeRuns: 1 },
    });

    expect(getHrHitStatus(singleHrTodayRow).tier).toBe('single');
    expect(getHrHitStatus(singleHrTodayRow).badgeLabel).toBe('HR TODAY');

    render(
      <HrNextCard
        row={singleHrTodayRow}
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
    expect(screen.getByText(/HR TODAY/i)).toBeTruthy();
  });

  it('renders Bronze styling and 2x HR TODAY badge when player hits 2 HRs today', () => {
    const multiHrTodayRow = makeMockRow({
      raw: { homeRunsToday: 2 },
    });

    expect(getHrHitStatus(multiHrTodayRow).tier).toBe('multi');
    expect(getHrHitStatus(multiHrTodayRow).badgeLabel).toBe('2x HR TODAY');

    render(
      <HrNextCard
        row={multiHrTodayRow}
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
    expect(screen.getByText(/2x HR TODAY/i)).toBeTruthy();
  });
});
