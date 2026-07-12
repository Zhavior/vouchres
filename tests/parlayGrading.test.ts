import { describe, expect, it, vi } from 'vitest';
import type { Leg, Parlay } from '../src/types';

vi.mock('../src/lib/apiClient', () => ({
  apiClient: { post: vi.fn() },
}));

import { buildGradeRequest, parlayIsGradable } from '../src/lib/parlayGrading';

function parlay(legs: Leg[], wagerAmount: number | undefined = 1): Parlay {
  return {
    id: 'parlay-1',
    title: 'Test parlay',
    legs,
    totalOdds: '+100',
    oddsValue: 2,
    riskTier: 'LOW',
    status: 'PENDING',
    createdAt: '2026-07-11T00:00:00.000Z',
    wagerAmount,
  };
}

function leg(overrides: Partial<Leg> = {}): Leg {
  return {
    id: 'leg-1',
    sport: 'MLB',
    game: 'NYY vs BOS',
    market: 'Home run',
    selection: 'Aaron Judge 1+ HR',
    odds: -110,
    status: 'PENDING',
    gamePk: '777001',
    marketCode: 'ANYTIME_HR',
    threshold: 1,
    ...overrides,
  };
}

describe('parlay grading request', () => {
  it('converts American odds and normalizes canonical fields', () => {
    expect(buildGradeRequest(parlay([leg()]))).toEqual({
      legs: [{
        sport: 'mlb',
        gamePk: '777001',
        market: 'anytime_hr',
        selection: 'Aaron Judge 1+ HR',
        threshold: 1,
        oddsDecimal: 1.909,
      }],
      stakeUnits: 1,
    });
  });

  it('omits unknown odds instead of submitting null', () => {
    const request = buildGradeRequest(parlay([leg({ odds: null })]));

    expect(request?.legs[0]).not.toHaveProperty('oddsDecimal');
  });

  it('skips invalid legacy legs and safely defaults invalid stakes', () => {
    const request = buildGradeRequest(parlay([
      leg({ id: 'bad-sport', sport: 'NHL' }),
      leg({ id: 'blank-selection', selection: '  ' }),
      leg({ id: 'valid', odds: 450 }),
    ], -25));

    expect(request?.legs).toHaveLength(1);
    expect(request?.legs[0].oddsDecimal).toBe(5.5);
    expect(request?.stakeUnits).toBe(1);
  });

  it('does not mark a parlay gradable when no leg satisfies the API contract', () => {
    const value = parlay([leg({ sport: 'NHL' })]);

    expect(buildGradeRequest(value)).toBeNull();
    expect(parlayIsGradable(value)).toBe(false);
  });

  it('caps a grading preview at the server maximum of 12 legs', () => {
    const legs = Array.from({ length: 14 }, (_, index) => leg({
      id: `leg-${index}`,
      selection: `Player ${index} HR`,
    }));

    expect(buildGradeRequest(parlay(legs))?.legs).toHaveLength(12);
  });
});
