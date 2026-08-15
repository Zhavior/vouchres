export type GameLifecycle =
  | 'scheduled'
  | 'lineup_pending'
  | 'pregame'
  | 'warmup'
  | 'live'
  | 'delayed'
  | 'suspended'
  | 'postponed'
  | 'final'
  | 'cancelled';

export interface GameState {
  gameId: string;
  lifecycle: GameLifecycle;
  gameTime: string; // ISO8601 string
  homeTeamId: string;
  awayTeamId: string;
  stadiumId: string;
  inning: number;
  inningHalf: 'top' | 'bottom';
  scoreDifferential: number;
  outs: number;
  runnersOnBase: number;
}
