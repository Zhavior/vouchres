// @vitest-environment happy-dom

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HrBoard } from '../src/features/hr/components/Columns/HrBoard';
import type { HrBuckets } from '../src/features/hr/hooks/useHrBoardViewModel';
import type { HrWatchRow } from '../src/features/hr/types/hrWatch';

function makeRow(overrides: Partial<HrWatchRow> = {}): HrWatchRow {
  return {
    stableId: 'juan-soto',
    playerName: 'Juan Soto',
    playerId: 1,
    team: 'NYM',
    opponent: 'PHI',
    teamLogoUrl: null,
    opponentLogoUrl: null,
    pitcherName: 'Aaron Nola',
    venue: 'Citizens Bank Park',
    gamePk: 10,
    gameTime: '2026-07-16T23:05:00Z',
    headshotUrl: null,
    rank: 1,
    hrScore: 98,
    hitterPower: 100,
    pitcherVulnerability: 72,
    parkFactor: 108,
    recentForm: 90,
    vouchScore: 8,
    dataConfidence: 88,
    truthStatus: 'projected',
    riskTier: 'Elite',
    oddsLabel: 'Odds TBD',
    reasons: ['Elite power against a vulnerable right-hander'],
    warnings: ['Official lineup not confirmed'],
    sourceMode: 'curated',
    ...overrides,
  };
}

function makeBuckets(): HrBuckets {
  return {
    Elite: [makeRow()],
    Strong: [makeRow({ stableId: 'pete-alonso', playerName: 'Pete Alonso', playerId: 2, riskTier: 'Core' })],
    Watch: [makeRow({ stableId: 'lindor', playerName: 'Francisco Lindor', playerId: 3, riskTier: 'Watch' })],
    Sleepers: [makeRow({ stableId: 'nimmo', playerName: 'Brandon Nimmo', playerId: 4, riskTier: 'Deep' })],
  };
}

describe('HR comparison board', () => {
  it('keeps all four engine tiers visible in the desktop comparison contract', () => {
    render(<HrBoard buckets={makeBuckets()} onSelectPlayer={vi.fn()} onViewProfile={vi.fn()} />);

    expect(document.querySelector('[aria-label="Elite signals"]')).toBeTruthy();
    expect(document.querySelector('[aria-label="Strong signals"]')).toBeTruthy();
    expect(document.querySelector('[aria-label="Watch signals"]')).toBeTruthy();
    expect(document.querySelector('[aria-label="Sleeper signals"]')).toBeTruthy();
    expect(screen.queryByText(/players found/i)).toBeNull();
  });

  it('provides explicit research and slip actions for a player', () => {
    const onViewProfile = vi.fn();
    const onAddToSlip = vi.fn();
    render(
      <HrBoard
        buckets={makeBuckets()}
        onSelectPlayer={vi.fn()}
        onViewProfile={onViewProfile}
        onAddToSlip={onAddToSlip}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Research Juan Soto' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add Juan Soto to slip' }));

    expect(onViewProfile).toHaveBeenCalledWith(expect.objectContaining({ playerName: 'Juan Soto' }));
    expect(onAddToSlip).toHaveBeenCalledWith(expect.objectContaining({ playerName: 'Juan Soto' }));
  });

  it('makes a verified home run result obvious on the compact card', () => {
    render(
      <HrBoard
        buckets={makeBuckets()}
        onSelectPlayer={vi.fn()}
        onViewProfile={vi.fn()}
        getHrResult={(playerId) => playerId === 1 ? 'hit' : null}
      />,
    );

    const eliteColumn = document.querySelector('[aria-label="Elite signals"]');
    expect(eliteColumn?.textContent).toContain('HR');
  });
});
