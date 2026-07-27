import { fetchMlbStatHubRows } from '../../features/mlb-stats/engine/mlbStatsApiData';
import type { MlbStatsContract } from '../contracts/mlbStats';

export async function loadMlbStats(
  statType: Parameters<typeof fetchMlbStatHubRows>[0],
  date: string,
  statScope: Parameters<typeof fetchMlbStatHubRows>[2] = 'season',
): Promise<MlbStatsContract> {
  const rows = await fetchMlbStatHubRows(
    statType,
    date,
    statScope,
  );

  return {
    rows,
    statType,
    date,
    statScope,
    loadedAt: new Date().toISOString(),
  };
}
