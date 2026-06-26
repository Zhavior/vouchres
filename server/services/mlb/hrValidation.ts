/**
 * HR Board Validation System — Types
 *
 * Every HR candidate must pass through validateHrCandidate() before scoring.
 * This file defines the types for the validation + injury + pool + debug layers.
 */

/* ============ Status system ============ */

export type HrCandidateStatus = "confirmed" | "projected" | "warning" | "incomplete" | "blocked";

export type InjuryStatus =
  | "healthy"
  | "day_to_day"
  | "questionable"
  | "injured_list"
  | "scratched"
  | "unknown";

export type LineupStatus = "confirmed" | "projected" | "bench" | "unknown";

export type RefreshStatus = "fresh" | "stale" | "projected" | "blocked";

/* ============ Today Player Pool ============ */

export interface TodayPlayer {
  playerId: number;
  playerName: string;
  teamId: number;
  teamAbbrev: string;
  opponentTeamId: number;
  gamePk: number;
  gameDate: string;
  homeOrAway: "home" | "away";
  battingHand: "L" | "R" | "S" | "U";
  lineupStatus: LineupStatus;
  battingOrder?: number;
  activeRosterStatus: boolean;
  injuryStatus: InjuryStatus;
  injuryDescription?: string;
  injurySource?: string;
  lastUpdated: string;
  dataSource: string;
}

export interface TodayPlayerPool {
  date: string;
  totalPlayersChecked: number;
  confirmedStarters: number;
  projectedStarters: number;
  benchOrUnknown: number;
  injuredScratchedBlocked: number;
  hrCandidatesScored: number;
  players: TodayPlayer[];
  lastRefresh: string;
  dataSource: string;
}

/* ============ Validation result ============ */

export interface ValidationResult {
  valid: boolean;
  status: HrCandidateStatus;
  reasons: string[];
  warnings: string[];
}

/* ============ Scored HR candidate ============ */

export interface ScoredHrCandidate {
  playerId: number;
  playerName: string;
  team: string;
  teamId: number;
  teamAbbrev: string;
  opponent: string;
  opponentTeamId: number;
  gamePk: number;
  opponentPitcher: string;
  opponentPitcherId: number;
  lineupStatus: LineupStatus;
  injuryStatus: InjuryStatus;
  hrScore: number;
  dataConfidence: number;
  riskTier: "Strong" | "Playable" | "Sneaky" | "Lotto" | "Avoid";
  status: HrCandidateStatus;
  reasons: string[];
  warnings: string[];
  dataQuality: "full" | "partial" | "limited";
  lastUpdated: string;
  dataSource: string;
}

/* ============ Game context for validation ============ */

export interface GameContext {
  gamePk: number;
  gameDate: string;
  awayTeamId: number;
  homeTeamId: number;
  awayTeamAbbrev: string;
  homeTeamAbbrev: string;
  probablePitchers: {
    away: { pitcherId: number; pitcherName: string; teamId: number } | null;
    home: { pitcherId: number; pitcherName: string; teamId: number } | null;
  };
  status: string;
}

/* ============ Debug endpoint ============ */

export interface HrDebugResponse {
  date: string;
  gamesLoaded: number;
  teamsLoaded: number;
  rostersLoaded: number;
  injuryReportsLoaded: number;
  probablePitchersLoaded: number;
  confirmedLineupsLoaded: number;
  projectedLineupsLoaded: number;
  totalPlayersChecked: number;
  todayPlayerPoolCount: number;
  candidatesValidated: number;
  candidatesScored: number;
  candidatesBlocked: number;
  blockedReasons: Record<string, number>;
  staleDataWarnings: string[];
  placeholderWarnings: string[];
  lastRefresh: string;
}

/* ============ Placeholder detection ============ */

export const PLACEHOLDER_VALUES = [
  "tbd",
  "unknown",
  "player name",
  "team a",
  "team b",
  "sample",
  "demo",
  "placeholder",
  "mock",
  "projected placeholder",
  "",
] as const;

export function isPlaceholder(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") {
    const lower = value.trim().toLowerCase();
    return PLACEHOLDER_VALUES.includes(lower as any) || lower === "";
  }
  return false;
}

/* ============ Cache metadata ============ */

export interface CacheMeta {
  lastUpdated: string;
  dataSource: string;
  refreshStatus: RefreshStatus;
  stale: boolean;
}
