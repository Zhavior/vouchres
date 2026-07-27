export type SportsPlayer = {
  id: string;
  name: string;
  teamId?: string;
  position?: string;
  league: string;
  metadata?: Record<string, unknown>;
};
