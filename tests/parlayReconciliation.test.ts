import { describe, expect, it } from 'vitest';
import { reconcileParlays, UNSYNCED_PARLAY_GRACE_MS } from '../src/domain/parlay/reconcileParlays';
import type { Parlay } from '../src/types';

const NOW = Date.parse('2026-07-12T12:00:00.000Z');

function slip(id: string, patch: Partial<Parlay> = {}): Parlay {
  return {
    id,
    title: id,
    legs: [],
    totalOdds: '',
    oddsValue: 0,
    riskTier: 'LOW',
    status: 'PENDING',
    mode: 'REAL',
    createdAt: new Date(NOW - 60_000).toISOString(),
    ...patch,
  };
}

describe('ParlayOS backend reconciliation', () => {
  it('treats an authenticated empty backend response as truth', () => {
    const staleSynced = slip('local', { backendPickId: 'missing', backendSyncState: 'synced' });
    expect(reconcileParlays([], [staleSynced], { authenticated: true, nowMs: NOW })).toEqual([]);
  });

  it('preserves practice slips and recent unsynced real slips', () => {
    const practice = slip('practice', { mode: 'PRACTICE' });
    const recent = slip('recent', { backendSyncState: 'failed' });
    expect(reconcileParlays([], [practice, recent], { authenticated: true, nowMs: NOW }))
      .toEqual([practice, recent]);
  });

  it('removes stale unsynced real slips after the recovery window', () => {
    const stale = slip('stale', {
      backendSyncState: 'failed',
      createdAt: new Date(NOW - UNSYNCED_PARLAY_GRACE_MS - 1).toISOString(),
    });
    expect(reconcileParlays([], [stale], { authenticated: true, nowMs: NOW })).toEqual([]);
  });

  it('deduplicates a retry by clientRef and prefers backend truth', () => {
    const local = slip('draft-1', { clientRef: 'stable-1', backendSyncState: 'failed' });
    const backend = slip('backend-1', {
      clientRef: 'stable-1',
      backendPickId: 'backend-1',
      backendSyncState: 'synced',
      status: 'WON',
    });
    expect(reconcileParlays([backend], [local], { authenticated: true, nowMs: NOW })).toEqual([backend]);
  });

  it('does not apply backend cleanup while signed out', () => {
    const local = slip('local');
    expect(reconcileParlays([], [local], { authenticated: false, nowMs: NOW })).toEqual([local]);
  });

});
