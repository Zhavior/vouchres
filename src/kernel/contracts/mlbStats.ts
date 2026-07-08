import type { StatPlayerRow } from '../../features/mlb-stats/types/statHubTypes';

export type MlbStatsContract = {
  rows: StatPlayerRow[];
  statType: string;
  date: string;
  statScope: string;
  loadedAt: string;
};
