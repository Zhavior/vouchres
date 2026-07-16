import { describe, expect, it } from 'vitest';
import {
  buildHrMatchupGroups,
  getHrTableReason,
  getHrTableRisk,
  getHrTableTier,
} from '../src/features/hr/components/Table/hrTableModel';
import type { HrWatchRow } from '../src/features/hr/types/hrWatch';

function makeRow(overrides: Partial<HrWatchRow>): HrWatchRow {
  return {
    stableId: 'row-1',
    playerName: 'Test Hitter',
    playerId: 1,
    team: 'NYY',
    opponent: 'BOS',
    teamLogoUrl: null,
    opponentLogoUrl: null,
    pitcherName: 'Test Pitcher',
    venue: 'Test Park',
    gamePk: 10,
    gameTime: '2026-07-16T23:05:00Z',
    headshotUrl: null,
    rank: 1,
    hrScore: 90,
    hitterPower: 88,
    pitcherVulnerability: 75,
    parkFactor: 70,
    recentForm: 65,
    vouchScore: 8,
    dataConfidence: 90,
    truthStatus: 'official',
    riskTier: 'Elite',
    oddsLabel: '+300',
    reasons: ['Power advantage'],
    warnings: ['Wind may shift'],
    sourceMode: 'confirmed',
    ...overrides,
  };
}

describe('HR table matchup model', () => {
  it('maps engine tiers to the customer-facing tier language', () => {
    expect(getHrTableTier(makeRow({ riskTier: 'Elite' }))).toBe('Elite');
    expect(getHrTableTier(makeRow({ riskTier: 'Core' }))).toBe('Strong');
    expect(getHrTableTier(makeRow({ riskTier: 'Watch' }))).toBe('Watch');
    expect(getHrTableTier(makeRow({ riskTier: 'Deep' }))).toBe('Sleeper');
    expect(getHrTableTier(makeRow({ riskTier: 'Blocked' }))).toBeNull();
  });

  it('groups both sides of a game and orders candidates from Elite to Sleeper', () => {
    const groups = buildHrMatchupGroups([
      makeRow({ stableId: 'deep', playerName: 'Deep Bat', team: 'BOS', opponent: 'NYY', riskTier: 'Deep', hrScore: 78 }),
      makeRow({ stableId: 'strong', playerName: 'Strong Bat', riskTier: 'Core', hrScore: 92 }),
      makeRow({ stableId: 'elite', playerName: 'Elite Bat', riskTier: 'Elite', hrScore: 98 }),
      makeRow({ stableId: 'watch', playerName: 'Watch Bat', team: 'BOS', opponent: 'NYY', riskTier: 'Watch', hrScore: 87 }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].rows.map((row) => row.playerName)).toEqual(['Elite Bat', 'Strong Bat', 'Watch Bat', 'Deep Bat']);
    expect(groups[0].tierCounts).toEqual({ Elite: 1, Strong: 1, Watch: 1, Sleeper: 1 });
  });

  it('uses normalized team pairs when a game id is unavailable', () => {
    const groups = buildHrMatchupGroups([
      makeRow({ stableId: 'one', gamePk: null, team: 'LAD', opponent: 'SD' }),
      makeRow({ stableId: 'two', gamePk: null, team: 'SD', opponent: 'LAD' }),
    ]);

    expect(groups).toHaveLength(1);
  });

  it('keeps engineering language out of customer-facing reason and risk copy', () => {
    const row = makeRow({
      reasons: ['Backend roster registry mismatch', '21 HR this season'],
      warnings: ['Team mismatch / stale roster assignment', 'Wind may shift'],
    });

    expect(getHrTableReason(row)).toContain("Today's signal combines");
    expect(getHrTableReason(row)).not.toMatch(/roster|registry|mismatch/i);
    expect(getHrTableRisk(row)).toBe('Wind may shift');
  });

  it('moves projected lineup state to the matchup summary', () => {
    const groups = buildHrMatchupGroups([
      makeRow({ stableId: 'one', truthStatus: 'projected' }),
      makeRow({ stableId: 'two', playerName: 'Second Hitter', truthStatus: 'projected' }),
    ]);

    expect(groups[0].lineupNotice).toBe('2 projected players; official batting order not posted.');
  });
});
