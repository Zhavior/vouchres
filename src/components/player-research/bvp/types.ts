export type HandSplit = "ALL" | "LHP" | "RHP";
export type VenueSplit = "ALL" | "home" | "away";
export type MlbRole = "batter" | "pitcher" | "unknown";
export type BvpDataSource = "official_mlb";

export interface PitchStat {
  pitchType: string;
  pitchName: string;
  usagePct: number | null;
  batterWoba: number | null;
  batterRunValue: number | null;
  pitches: number | null;
}

export interface Batter {
  id: string;
  name: string;
  team: string;
  position: string;
  bats: "L" | "R" | "S";
  xSlg: number | null;
  hardHitPct: number | null;
  iso: number | null;
  exitVelo: number | null;
}

export interface Pitcher {
  id: string;
  name: string;
  team: string;
  position: string;
  throws: "L" | "R";
  era: number | null;
  whip: number | null;
  barrelRateAllowed: number | null;
  hr9VsLhb: number | null;
  hr9VsRhb: number | null;
  hr9: number | null;
  pitchMix: PitchStat[];
}

export interface BvPHistory {
  atBats: number | null;
  hits: number | null;
  homeRuns: number | null;
  strikeouts: number | null;
  walks: number | null;
  walkRate: number | null;
  hardHitRate: number | null;
  battingAverage: number | null;
  ops: number | null;
}

export interface BvPMatchup {
  id: string;
  gameLabel: string;
  venueSplit: Exclude<VenueSplit, "ALL">;
  batterId: string;
  pitcherId: string;
  history: BvPHistory;
  pitchArsenal: PitchStat[];
  matchupRating: number | null;
  dataSource: BvpDataSource;
  truthLabel: string;
}

export interface BvpGameSide {
  id: string;
  gamePk: number;
  gameLabel: string;
  venueSplit: Exclude<VenueSplit, "ALL">;
  pitcherId: string;
  pitcherName: string;
  pitcherThrows: "L" | "R" | "U";
  pitcherTeamAbbr: string;
  batterTeamAbbr: string;
}

export const BVP_TRUTH_LABEL = "Official MLB Stats API + Savant";
