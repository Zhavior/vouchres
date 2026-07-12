import { describe, expect, it } from 'vitest';
import { buildHrLensSignal, summarizeHrLens } from '../src/features/hr/engine/hrLensModel';
import type { HrWatchRow } from '../src/features/hr/types/hrWatch';

function row(overrides: Partial<HrWatchRow> = {}): HrWatchRow {
  return {
    stableId: 'game-1-player-1', playerName: 'Test Player', playerId: 1, team: 'TOR', opponent: 'NYY',
    teamLogoUrl: null, opponentLogoUrl: null, gamePk: 1, gameTime: null, headshotUrl: null, rank: 1,
    hrScore: 84, hitterPower: 91, pitcherVulnerability: 78, parkFactor: 64, recentForm: 82,
    vouchScore: 80, dataConfidence: 88, truthStatus: 'official', riskTier: 'Elite', oddsLabel: '+300',
    reasons: [], warnings: [], sourceMode: 'confirmed', ...overrides,
  };
}

describe('HR lens model', () => {
  it('only enables signal alerts for official, non-blocked rows', () => {
    expect(buildHrLensSignal(row()).alertEligible).toBe(true);
    expect(buildHrLensSignal(row({ truthStatus: 'projected' })).alertEligible).toBe(false);
    expect(buildHrLensSignal(row({ truthStatus: 'blocked', riskTier: 'Blocked' })).alertEligible).toBe(false);
  });

  it('reports observed factor completeness without inventing missing math', () => {
    const signal = buildHrLensSignal(row({ parkFactor: null, recentForm: null }));
    expect(signal.completeness).toBe(50);
    expect(signal.strongestFactor?.label).toBe('Power');
    expect(signal.tags).toContain('Power driver');
  });

  it('summarizes truth states and confidence', () => {
    expect(summarizeHrLens([row(), row({ stableId: '2', truthStatus: 'projected', dataConfidence: 72 })])).toEqual({
      official: 1, projected: 1, complete: 2, averageConfidence: 80,
    });
  });
});
