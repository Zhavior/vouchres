/**
 * Slate Results contract — the graded record of one MLB day, as the Results
 * desk renders it. Mirrors server/services/results/slateResultsService.ts.
 *
 * Nulls are load-bearing: a null tier means the slate has no pregame snapshot
 * to grade against, and the desk must show UNKNOWN rather than a fraction.
 */

export interface SlateTally {
  hit: number;
  total: number;
}

export interface SlateGameResult {
  gamePk: number;
  matchup: string;
  awayAbbr: string;
  homeAbbr: string;
  status: string;
  topPlays: SlateTally | null;
  zoneFit: SlateTally | null;
  homeRuns: number;
}

export interface SlateCapperTicket {
  playerId: number;
  playerName: string;
  teamAbbr: string | null;
  headshot: string;
  /** true = homered, false = did not, null = slate still in progress. */
  hit: boolean | null;
}

export interface SlateCapperResult {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  ticket: SlateCapperTicket | null;
  correct: number;
  picks: number;
}

export interface SlateHomeRun {
  id: string;
  playerId: number;
  playerName: string;
  team: string;
  teamAbbr: string;
  headshot: string;
  matchup: string;
  inning: number;
  exitVelocity: number | null;
  distance: number | null;
  timestamp: string;
}

export interface SlateResultsContract {
  date: string;
  isToday: boolean;
  generatedAt: string;
  grade: {
    letter: string | null;
    lift: number | null;
    reason: string;
  };
  totals: {
    slateHomeRuns: number;
    bangs: number;
    correctCapperPicks: number;
  };
  tiers: {
    cappersTicket: SlateTally;
    topPlays: SlateTally | null;
    zoneFit: SlateTally | null;
  };
  games: SlateGameResult[];
  cappers: SlateCapperResult[];
  homeRuns: SlateHomeRun[];
  board: {
    source: 'snapshot' | 'none';
    note: string;
  };
  warnings: string[];
}
