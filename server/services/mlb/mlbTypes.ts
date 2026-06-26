/** Clean, app-friendly MLB shapes produced by the normalizer. */

export type DataQuality = "full" | "partial" | "limited";

export interface NormalizedPitcher {
  pitcherId: number;
  pitcherName: string;
  throws: "L" | "R" | "U";
  team: string;
  teamId: number;
}

export interface NormalizedPlayer {
  playerId: number;
  playerName: string;
  position: string;
  bats: "L" | "R" | "S" | "U";
  team: string;
  teamId: number;
  battingOrder?: number;
  headshot: string;
}

export interface NormalizedTeam {
  teamId: number;
  name: string;
  abbreviation: string;
  record?: { wins: number; losses: number };
}

export interface NormalizedLinescore {
  currentInning?: number;
  inningState?: string;
  awayRuns: number;
  homeRuns: number;
  awayHits?: number;
  homeHits?: number;
}

export interface NormalizedGame {
  gamePk: number;
  gameDate: string;
  status: string;
  awayTeam: NormalizedTeam;
  homeTeam: NormalizedTeam;
  venue: string;
  probablePitchers: {
    away: NormalizedPitcher | null;
    home: NormalizedPitcher | null;
  };
  score: { away: number; home: number };
  inning: number | null;
  linescore: NormalizedLinescore | null;
  weather: { condition?: string; tempF?: number; windMph?: number; windDir?: string } | null;
  bettingContext: Record<string, unknown> | null;
  aiContext: Record<string, unknown> | null;
  dataQuality: DataQuality;
}

/** MLB headshot CDN pattern (same one the frontend already uses). */
export function headshotUrl(playerId: number): string {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${playerId}/headshot/67/current`;
}
