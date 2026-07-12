import { describe, expect, it } from 'vitest';
import type { Leg, Parlay } from '../src/types';
import { deriveCanonicalParlayState, selectParlayWorkspaces } from '../src/domain/parlayState';

function leg(overrides: Partial<Leg> = {}): Leg {
  return {
    id: 'leg-1',
    sport: 'MLB',
    game: 'NYY vs BOS',
    market: 'Home run',
    selection: 'Aaron Judge 1+ HR',
    odds: 250,
    status: 'PENDING',
    gamePk: '777001',
    playerId: '592450',
    marketCode: 'ANYTIME_HR',
    statTarget: 1,
    comparator: '>=',
    eventKey: 'MLB_777001_592450_ANYTIME_HR_1_GTE',
    ...overrides,
  };
}

function parlay(overrides: Partial<Parlay> = {}): Parlay {
  return {
    id: 'parlay-1',
    title: 'Test parlay',
    legs: [leg({ gameStartTime: '2026-07-12T23:00:00.000Z' })],
    totalOdds: '+250',
    oddsValue: 3.5,
    riskTier: 'LOW',
    status: 'PENDING',
    mode: 'REAL',
    createdAt: '2026-07-11T00:00:00.000Z',
    backendPickId: 'backend-1',
    backendSyncState: 'synced',
    ...overrides,
  };
}

describe('canonical parlay state', () => {
  const now = new Date('2026-07-12T20:00:00.000Z');

  it('separates settlement, sync, identity, and lifecycle', () => {
    expect(deriveCanonicalParlayState(parlay(), now)).toEqual({
      settlement: 'pending',
      sync: 'synced',
      identity: 'complete',
      lifecycle: 'upcoming',
      attentionReasons: [],
    });
  });

  it('routes incomplete and failed local parlays to attention', () => {
    const value = parlay({
      backendPickId: undefined,
      backendSyncState: 'failed',
      legs: [leg({ eventKey: undefined, playerId: undefined, gameStartTime: undefined })],
    });
    const state = deriveCanonicalParlayState(value, now);

    expect(state.sync).toBe('failed');
    expect(state.identity).toBe('repair_required');
    expect(state.attentionReasons).toEqual(['sync_failed', 'identity_repair', 'start_time_missing']);
  });

  it('builds stable workspace selectors from one collection', () => {
    const upcoming = parlay({ id: 'upcoming' });
    const settled = parlay({ id: 'settled', status: 'WON' });
    const workspaces = selectParlayWorkspaces([upcoming, settled], now);

    expect(workspaces.upcoming.map(({ parlay }) => parlay.id)).toEqual(['upcoming']);
    expect(workspaces.results.map(({ parlay }) => parlay.id)).toEqual(['settled']);
  });

  it('uses authoritative game status before estimated start-time lifecycle', () => {
    const live = parlay({
      feedLockedAt: '2026-07-12T18:00:00.000Z',
      legs: [leg({ gameStartTime: '2026-07-12T23:00:00.000Z', gameStatus: 'In Progress' })],
    });
    const final = parlay({
      legs: [leg({ gameStartTime: '2026-07-13T23:00:00.000Z', gameStatus: 'Final' })],
    });

    expect(deriveCanonicalParlayState(live, now).lifecycle).toBe('live');
    expect(deriveCanonicalParlayState(final, now).lifecycle).toBe('awaiting_result');
  });

  it('does not treat a trust lock as proof that a game is live', () => {
    const lockedBeforeFirstPitch = parlay({ feedLockedAt: '2026-07-12T18:00:00.000Z' });
    expect(deriveCanonicalParlayState(lockedBeforeFirstPitch, now).lifecycle).toBe('upcoming');
  });
});
