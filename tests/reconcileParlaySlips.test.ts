import { describe, expect, it } from 'vitest';
import type { Parlay } from '../src/types';
import { reconcileParlaySlips } from '../src/app/reconcileParlaySlips';

function parlay(id: string, overrides: Partial<Parlay> = {}): Parlay {
  return {
    id,
    title: id,
    legs: [],
    totalOdds: 'Odds TBD',
    oddsValue: 0,
    riskTier: 'LOW',
    status: 'PENDING',
    createdAt: '2026-07-10T12:00:00.000Z',
    ...overrides,
  };
}

describe('reconcileParlaySlips', () => {
  const now = Date.parse('2026-07-12T12:00:00.000Z');

  it('uses backend status as authoritative across all parlay surfaces', () => {
    const backend = parlay('backend-1', {
      backendPickId: 'backend-1',
      status: 'LOST',
    });
    const staleLocalCopy = parlay('local-copy', {
      backendPickId: 'backend-1',
      status: 'PENDING',
    });

    expect(reconcileParlaySlips([backend], [staleLocalCopy], now)).toEqual([backend]);
  });

  it('removes stale unsynced real parlays that can never receive backend grades', () => {
    const stale = parlay('stale-local', { createdAt: '2026-07-09T00:00:00.000Z', mode: 'REAL' });

    expect(reconcileParlaySlips([], [stale], now)).toEqual([]);
  });

  it('retains recent unsynced and practice parlays', () => {
    const recent = parlay('recent', { createdAt: '2026-07-12T06:00:00.000Z', mode: 'REAL' });
    const practice = parlay('practice', { createdAt: '2026-01-01T00:00:00.000Z', mode: 'PRACTICE' });

    expect(reconcileParlaySlips([], [recent, practice], now)).toEqual([recent, practice]);
  });
});
