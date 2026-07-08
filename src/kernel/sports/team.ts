export type SportsTeam = {
  id: string;
  name: string;
  abbreviation?: string;
  league: string;
  metadata?: Record<string, unknown>;
};
