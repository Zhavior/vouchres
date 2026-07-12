/** @vitest-environment happy-dom */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Parlay } from '../src/types';
import { deriveCanonicalParlayState } from '../src/domain/parlayState';
import { CanonicalParlayCard } from '../src/components/parlay/hub/CanonicalParlayCard';

const parlay: Parlay = {
  id: 'parlay-hitbox',
  backendPickId: 'backend-hitbox',
  backendSyncState: 'synced',
  title: 'Two Game Truth Slip',
  totalOdds: '+300',
  oddsValue: 4,
  riskTier: 'MEDIUM',
  status: 'PENDING',
  mode: 'REAL',
  createdAt: '2026-07-11T12:00:00.000Z',
  legs: [{
    id: 'leg-hitbox',
    sport: 'MLB',
    game: 'NYY vs BOS',
    market: 'Home run',
    selection: 'Aaron Judge 1+ HR',
    odds: 300,
    status: 'PENDING',
    gamePk: '745101',
    playerId: '592450',
    marketCode: 'ANYTIME_HR',
    statTarget: 1,
    comparator: '>=',
    eventKey: 'MLB_745101_592450_ANYTIME_HR_1_GTE',
    gameStartTime: '2026-07-12T23:00:00.000Z',
  }],
};

describe('CanonicalParlayCard hitbox', () => {
  it('opens from the visible card body and keyboard', () => {
    const onOpen = vi.fn();
    render(<CanonicalParlayCard parlay={parlay} state={deriveCanonicalParlayState(parlay)} onViewStructure={onOpen} />);

    const card = screen.getByRole('group', { name: 'Open Two Game Truth Slip structure' });
    fireEvent.click(screen.getByText('Two Game Truth Slip'));
    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(card, { key: ' ' });

    expect(onOpen).toHaveBeenCalledTimes(3);
  });

  it('does not double-fire when the explicit Structure control is clicked', () => {
    const onOpen = vi.fn();
    render(<CanonicalParlayCard parlay={parlay} state={deriveCanonicalParlayState(parlay)} onViewStructure={onOpen} />);

    fireEvent.click(screen.getByRole('button', { name: 'Structure' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
