import { describe, expect, it } from 'vitest';
import { buildHrGameMapGroups, buildHrSignalPoints } from '../src/features/hr/components/Treemap/hrMapModel';
import type { HrWatchRow } from '../src/features/hr/types/hrWatch';

function row(overrides: Partial<HrWatchRow> = {}): HrWatchRow {
  return {
    stableId: 'player-1',
    playerName: 'Test Player',
    playerId: 1,
    team: 'NYY',
    opponent: 'BOS',
    teamLogoUrl: null,
    opponentLogoUrl: null,
    gamePk: 99,
    gameTime: '2026-07-16T23:00:00Z',
    headshotUrl: null,
    rank: 1,
    hrScore: 88,
    hitterPower: 90,
    pitcherVulnerability: 70,
    parkFactor: 105,
    recentForm: 70,
    vouchScore: 80,
    dataConfidence: 82,
    truthStatus: 'official',
    riskTier: 'Elite',
    oddsLabel: '+300',
    reasons: ['Strong matchup today'],
    warnings: ['Wind could shift'],
    sourceMode: 'confirmed',
    ...overrides,
  };
}

describe('HR Signal Field model', () => {
  it('groups both teams into one canonical game', () => {
    const groups = buildHrGameMapGroups([
      row(),
      row({ stableId: 'player-2', playerId: 2, playerName: 'Other Player', team: 'BOS', opponent: 'NYY' }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].rows).toHaveLength(2);
    expect(groups[0].confirmedCount).toBe(2);
  });

  it('maps canonical power and pitcher vulnerability without changing scores', () => {
    const player = row({ hitterPower: 100, pitcherVulnerability: 100, hrScore: 95 });
    const result = buildHrSignalPoints([player], 900, 500);

    expect(result.omitted).toHaveLength(0);
    expect(result.points[0].row).toBe(player);
    expect(result.points[0].anchorX).toBe(864);
    expect(result.points[0].anchorY).toBe(38);
    expect(result.points[0].x).toBeLessThanOrEqual(864);
    expect(result.points[0].y).toBeGreaterThanOrEqual(38);
  });

  it('offsets identical points while retaining their truthful anchors', () => {
    const result = buildHrSignalPoints([
      row(),
      row({ stableId: 'player-2', playerId: 2 }),
    ], 900, 500);

    expect(result.points[0].anchorX).toBe(result.points[1].anchorX);
    expect(result.points[0].anchorY).toBe(result.points[1].anchorY);
    expect(result.points[0].x).not.toBe(result.points[1].x);
  });

  it('omits rows with missing axis inputs instead of inventing coordinates', () => {
    const result = buildHrSignalPoints([row({ hitterPower: null })], 900, 500);

    expect(result.points).toHaveLength(0);
    expect(result.omitted).toHaveLength(1);
  });
});
