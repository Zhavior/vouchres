export type SportsGame = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  startTime: string;
  league: string;
  status?: string;
  metadata?: Record<string, unknown>;
};
