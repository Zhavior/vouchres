/** Frontend contract for the live HR notification feed. */

export interface HrEvent {
  id: string;
  playerId: number;
  playerName: string;
  headshot: string;
  team: string;
  teamAbbr: string;
  opponent: string;
  inning: number;
  halfInning: string;
  description: string;
  rbi: number;
  gamePk: number;
  matchup: string;
  timestamp: string;
  /** Statcast exit velocity (mph). Null when MLB published no hitData for the play. */
  exitVelocity?: number | null;
  /** Statcast projected distance (ft). Null when MLB published no hitData. */
  distance?: number | null;
}

export interface HrFeedResponse {
  count: number;
  events: HrEvent[];
  generatedAt: string;
}
