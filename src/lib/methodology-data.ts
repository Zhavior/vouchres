export interface DataLayer {
  id: string;
  label: string;
  count: string;
  description: string;
  status: 'SYNCED' | 'PROCESSING';
}

export const DATA_LAYERS: DataLayer[] = [
  { id: '01', label: 'STATCAST_TELEMETRY', count: '840K', description: 'Real-time exit velocity, launch angle, and spray direction vectors.', status: 'SYNCED' },
  { id: '02', label: 'PITCHER_VULNERABILITY', count: '120K', description: 'Historical deviation in vertical break and velocity decay per inning.', status: 'SYNCED' },
  { id: '03', label: 'ENVIRONMENTAL_VECTORS', count: '45K', description: 'Live wind shear, barometric pressure, and field orientation factors.', status: 'SYNCED' },
  { id: '04', label: 'MATCHUP_HISTORY', count: '210K', description: 'Batter vs. Pitcher archetype performance across 5 seasons.', status: 'SYNCED' },
];
