import { describe, expect, it } from 'vitest';
import { buildHrTeamMapGroups, flattenHrMapRows } from '../src/features/hr/components/Treemap/hrMapModel';
import type { HrBuckets } from '../src/features/hr/hooks/useHrBoardViewModel';
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
    gamePk: 10,
    gameTime: null,
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
    warnings: [],
    sourceMode: 'confirmed',
    ...overrides,
  };
}

describe('HR map model', () => {
  it('flattens tiers without rendering the same candidate twice', () => {
    const duplicate = makeRow({ stableId: 'duplicate' });
    const buckets: HrBuckets = {
      Elite: [duplicate],
      Strong: [duplicate],
      Watch: [makeRow({ stableId: 'watch', playerName: 'Watch Hitter' })],
      Sleepers: [],
    };

    expect(flattenHrMapRows(buckets).map((row) => row.stableId)).toEqual(['duplicate', 'watch']);
  });

  it('builds team summaries with the top candidate and honest score totals', () => {
    const groups = buildHrTeamMapGroups([
      makeRow({ stableId: 'judge', playerName: 'Aaron Judge', hrScore: 96, teamLogoUrl: '/nyy.svg' }),
      makeRow({ stableId: 'stanton', playerName: 'Giancarlo Stanton', hrScore: 84 }),
      makeRow({ stableId: 'raleigh', playerName: 'Cal Raleigh', team: 'SEA', hrScore: 91 }),
    ]);

    expect(groups.map((group) => group.team)).toEqual(['NYY', 'SEA']);
    expect(groups[0]).toMatchObject({ totalScore: 180, averageScore: 90, logoUrl: '/nyy.svg' });
    expect(groups[0].topPlayer.playerName).toBe('Aaron Judge');
  });
});
