export type SportsProjection = {
  playerId?: string;
  gameId?: string;
  metric: string;
  value: number;
  confidence?: number;
  source?: string;
};
