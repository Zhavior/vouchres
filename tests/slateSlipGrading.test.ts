import { describe, expect, it } from 'vitest';
import { gradeSlipsForSlate, slipBelongsToSlate } from '../src/components/results/slateSlipGrading';
import type { Leg, Parlay } from '../src/types';
import type { SlateHomeRun } from '../src/kernel/contracts/slateResults';

function leg(overrides: Partial<Leg>): Leg {
  return {
    id: overrides.id ?? 'leg-1',
    sport: 'MLB',
    game: 'ATL @ MIL',
    market: overrides.market ?? 'Anytime HR',
    selection: overrides.selection ?? 'Michael Harris II',
    odds: -110,
    status: 'PENDING',
    ...overrides,
  } as Leg;
}

function parlay(legs: Leg[], overrides: Partial<Parlay> = {}): Parlay {
  return {
    id: 'slip-1',
    title: 'Slate slip',
    legs,
    totalOdds: '+300',
    oddsValue: 300,
    riskTier: 'MEDIUM',
    status: 'PENDING',
    createdAt: '2026-08-23T18:00:00.000Z',
    ...overrides,
  } as Parlay;
}

const homeRuns: SlateHomeRun[] = [
  {
    id: 'hr-1', playerId: 671739, playerName: 'Michael Harris II', team: 'Atlanta Braves',
    teamAbbr: 'ATL', headshot: '', matchup: 'ATL @ MIL', inning: 9,
    exitVelocity: 96, distance: 380, timestamp: '2026-08-24T01:59:48.880Z',
  },
];

describe('slateSlipGrading', () => {
  it('settles an anytime-HR leg from the slate feed', () => {
    const graded = gradeSlipsForSlate(
      [parlay([leg({ playerId: 671739, marketCode: 'ANYTIME_HR' })])],
      '2026-08-23',
      homeRuns,
      false,
    );

    expect(graded.slips[0].legs[0].verdict).toBe('bang');
    expect(graded.legTally).toEqual({ hit: 1, total: 1 });
  });

  it('does not settle a market the HR feed cannot speak to', () => {
    const graded = gradeSlipsForSlate(
      [parlay([leg({ playerId: 671739, marketCode: 'HITS_2_PLUS', market: '2+ hits' })])],
      '2026-08-23',
      homeRuns,
      false,
    );

    expect(graded.slips[0].legs[0].verdict).toBe('ungraded');
    // An ungraded leg must not inflate the record either way.
    expect(graded.legTally).toEqual({ hit: 0, total: 0 });
  });

  it('holds a miss open while the slate is still being played', () => {
    const miss = [parlay([leg({ playerId: 999999, marketCode: 'ANYTIME_HR' })])];

    expect(gradeSlipsForSlate(miss, '2026-08-23', homeRuns, true).slips[0].legs[0].verdict).toBe('live');
    expect(gradeSlipsForSlate(miss, '2026-08-23', homeRuns, false).slips[0].legs[0].verdict).toBe('no_go');
  });

  it('requires the full target on a multi-HR leg', () => {
    const graded = gradeSlipsForSlate(
      [parlay([leg({ playerId: 671739, marketCode: 'ANYTIME_HR', statTarget: 2 })])],
      '2026-08-23',
      homeRuns,
      false,
    );

    expect(graded.slips[0].legs[0].verdict).toBe('no_go');
  });

  it('places a slip by its game clock, falling back to when it was saved', () => {
    const withStart = parlay([leg({ gameStartTime: '2026-08-22T23:10:00.000Z' })]);
    // Saved on the 23rd, but the game it covers starts on the 22nd locally.
    expect(slipBelongsToSlate(withStart, '2026-08-23')).toBe(false);
    expect(slipBelongsToSlate(parlay([leg({})]), '2026-08-23')).toBe(true);
  });
});
