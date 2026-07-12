import { beforeEach, describe, expect, it, vi } from 'vitest';

const sportsFetchJson = vi.hoisted(() => vi.fn());

vi.mock('../server/lib/sports/sportsHttpClient', () => ({ sportsFetchJson }));

import { fetchParlayLegProgressBatch } from '../server/services/mlb/parlayLiveProgressService';

const boxscore = {
  teams: {
    away: {
      players: {
        ID592450: { stats: { batting: { homeRuns: 1 } } },
      },
    },
    home: { players: {} },
  },
};

describe('fetchParlayLegProgressBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns deterministic progress across multiple games', async () => {
    sportsFetchJson.mockImplementation(async (url: string) => (
      url.includes('/linescore')
        ? { status: { detailedState: url.includes('745101') ? 'In Progress' : 'Final' } }
        : boxscore
    ));

    const result = await fetchParlayLegProgressBatch([
      { id: 'first', gamePk: '745101', playerId: '592450', marketCode: 'ANYTIME_HR', statTarget: 1 },
      { id: 'second', gamePk: '745202', playerId: '592450', marketCode: 'ANYTIME_HR', statTarget: 1 },
    ]);

    expect(result).toEqual([
      expect.objectContaining({ id: 'first', current: 1, gameStatus: 'In Progress' }),
      expect.objectContaining({ id: 'second', current: 1, gameStatus: 'Final' }),
    ]);
  });

  it('preserves official game status when box-score statistics are unavailable', async () => {
    sportsFetchJson.mockImplementation(async (url: string) => {
      if (url.includes('/linescore')) return { status: { detailedState: 'In Progress' } };
      throw new Error('box score temporarily unavailable');
    });

    const [result] = await fetchParlayLegProgressBatch([
      { id: 'partial', gamePk: '745303', playerId: '592450', marketCode: 'ANYTIME_HR', statTarget: 1 },
    ]);

    expect(result).toMatchObject({
      id: 'partial',
      current: null,
      gameStatus: 'In Progress',
      target: 1,
      label: 'Home runs',
    });
  });

  it('returns unavailable fields rather than fabricated progress when both sources fail', async () => {
    sportsFetchJson.mockRejectedValue(new Error('MLB unavailable'));

    const [result] = await fetchParlayLegProgressBatch([
      { id: 'unavailable', gamePk: '745404', playerId: '592450', marketCode: 'ANYTIME_HR', statTarget: 1 },
    ]);

    expect(result).toMatchObject({ id: 'unavailable', current: null, gameStatus: null });
  });
});
