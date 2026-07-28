import { describe, expect, it } from 'vitest';
import { buildHrLensSignal, summarizeHrLens } from '../src/features/hr/engine/hrLensModel';
import type { HrWatchRow } from '../src/features/hr/types/hrWatch';

function row(overrides: Partial<HrWatchRow> = {}): HrWatchRow {
  return {
    stableId: 'game-1-player-1', playerName: 'Test Player', playerId: 1, team: 'TOR', opponent: 'NYY',
    teamLogoUrl: null, opponentLogoUrl: null, gamePk: 1, gameTime: null, headshotUrl: null, rank: 1,
    hrScore: 84, hitterPower: 91, pitcherVulnerability: 78, parkFactor: 64, recentForm: 82,
    recentHomeRuns: 2, recentHrGames: 2, recentGamesChecked: 7,
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

  it.each([
    [0, 'Cold'], [20, 'Building'], [40, 'Heating Up'], [60, 'High Pressure'], [80, 'Breakout Zone'], [100, 'Breakout Zone'],
  ] as const)('maps HRPI %s to %s without calling it probability', (hrScore, expected) => {
    expect(buildHrLensSignal(row({ hrScore })).pressureBand).toBe(expected);
  });

  it('labels verified recent results without inventing breakout or cooling trends', () => {
    expect(buildHrLensSignal(row()).playerState).toBe('hot');
    const due = buildHrLensSignal(row({ recentHomeRuns: 0, recentHrGames: 0 }));
    expect(due.playerState).toBe('due-watch');
    expect(due.stateExplanation).toContain('Results gap, not a guarantee');
  });

  it('withholds a player state when recent result evidence is missing', () => {
    const signal = buildHrLensSignal(row({ recentHomeRuns: null, recentHrGames: null, recentGamesChecked: null }));
    expect(signal.playerState).toBe('insufficient-data');
    expect(signal.playerStateLabel).toBe('More Data Needed');
  });
});
