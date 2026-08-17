// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { HrNextCard } from '../src/features/hr-next/components/HrNextCard';
import type { HrWatchRow } from '../src/features/hr/types/hrWatch';

const mockRow: HrWatchRow = {
  playerId: 660271,
  playerName: 'Shohei Ohtani',
  team: 'LAD',
  opponent: 'SD',
  gameTime: '2026-08-15T23:10:00Z',
  hrScore: 94.2,
  riskTier: 'Elite',
  pitcherName: 'Dylan Cease',
  hitterPower: 96,
  pitcherVulnerability: 74,
  parkFactor: 112,
  barrelRate: 0.192,
  truthStatus: 'official',
  bookOdds: 280,
  oddsLabel: '+280',
  recentHomeRuns: 3,
  warnings: [],
  reasons: ['Elite barrel rate 19.2%', 'High flyball vulnerability'],
  stableId: 'ohtani-660271',
} as unknown as HrWatchRow;

describe('HR Next Pro Mode Card & 4-Tier Visuals', () => {
  it('renders standard compact row format when isProMode is false', () => {
    render(
      <HrNextCard
        row={mockRow}
        active={false}
        saved={false}
        isReceiptOpen={false}
        isProMode={false}
        onSelect={vi.fn()}
        onToggleSaved={vi.fn()}
        onAddToSlip={vi.fn()}
      />
    );

    const card = screen.getByTestId('hr-card-ohtani-660271');
    expect(card).toBeTruthy();
    expect(card.getAttribute('data-pro-mode')).toBe('false');
    expect(screen.getByText('Shohei Ohtani')).toBeTruthy();
    expect(screen.getByText('94')).toBeTruthy();
  });

  it('renders expanded Hero Telemetry Card when isProMode is true', () => {
    render(
      <HrNextCard
        row={mockRow}
        active={false}
        saved={false}
        isReceiptOpen={false}
        isProMode={true}
        onSelect={vi.fn()}
        onToggleSaved={vi.fn()}
        onAddToSlip={vi.fn()}
      />
    );

    const card = screen.getByTestId('hr-card-ohtani-660271');
    expect(card).toBeTruthy();
    expect(card.getAttribute('data-pro-mode')).toBe('true');
    
    // Player information & Matchup
    expect(screen.getByText('Shohei Ohtani')).toBeTruthy();
    expect(screen.getByText('Dylan Cease')).toBeTruthy();
    
    // Tier Badge & HR Intelligence 7Days HR tag
    // Tier label is plain text now — the crown emoji was dropped and the tier
    // accent colour carries the signal. data-tier is the structural assertion.
    expect(card.getAttribute('data-tier')).toBe('elite');
    expect(screen.getAllByText(/^ELITE$/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/7Days HR: 3/i)).toBeTruthy();

    // Deep Intel Telemetry Metrics. Labels were retitled to match what the
    // values actually are — "Avg Exit Velo" (season average from the Statcast
    // leaderboard, not a max) and "Barrel %" — so assert the current wording.
    expect(screen.getByText(/Avg Exit Velo/i)).toBeTruthy();
    expect(screen.getByText(/Barrel %/i)).toBeTruthy();
    // cardUtils converts the fraction 0.192 to a 19.2 percent before render.
    expect(screen.getByText('19.2%')).toBeTruthy();
    expect(screen.getByText(/Hard Hit/i)).toBeTruthy();
    expect(screen.getByText(/Park/i)).toBeTruthy();
    expect(screen.getByText('+12%')).toBeTruthy();
    
    // Action buttons are icon-only now, so assert their accessible names
    // rather than visible text — that is the contract screen readers rely on.
    expect(screen.getByRole('button', { name: /Research for Shohei Ohtani/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Shohei Ohtani to parlay slip/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Shohei Ohtani (to|from) My List/i })).toBeTruthy();
  });

  it('renders Today HR badge when player has hit HR today', () => {
    const liveHrRow = {
      ...mockRow,
      hasHitHrToday: true,
    } as unknown as HrWatchRow;

    render(
      <HrNextCard
        row={liveHrRow}
        active={false}
        saved={false}
        isReceiptOpen={false}
        isProMode={true}
        onSelect={vi.fn()}
        onToggleSaved={vi.fn()}
        onAddToSlip={vi.fn()}
      />
    );

    expect(screen.getByText(/Today HR/i)).toBeTruthy();
  });
});
