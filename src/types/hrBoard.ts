/** Frontend contract for the Daily HR Edge Board (mirrors server shapes). */

export type Grade = "A+" | "A" | "B" | "C" | "D" | "F";
export type FormTag = "Hot" | "Average" | "Cold" | "Slump";
export type RiskLabel = "Strong" | "Playable" | "Sneaky" | "Longshot" | "Lotto" | "Avoid";
export type ProjectionType = "Projected" | "Projection Preview" | "Confirmed" | "Live";

export interface HrRowJudge {
  approvalStatus: "Approved" | "Playable but risky" | "Needs more data" | "Avoid";
  riskLabel: RiskLabel;
  judgeNote: string;
  whatCouldGoWrong: string[];
  parlayAllowed: boolean;
}

export interface HrBoardRow {
  playerId: number;
  playerName: string;
  team: string;
  teamId: number;
  headshot: string;
  grade: Grade;
  hrEdge: number;
  estimatedHrProb: number;
  impliedOdds: string;
  bestOdds: string;
  vouchScore: number;
  formTag: FormTag;
  opposingPitcher: string;
  opposingPitcherTeam: string;
  pitcherVulnerability: number;
  parkFactor: number;
  hrMultiplier: number;
  dataConfidence: number;
  weatherBoost: number;
  gameStatus: string;
  projectionType: ProjectionType;
  lineupSpot: number;
  lineMovement: number;
  source: string;
  riskLabel: RiskLabel;
  reasons: string[];
  judge: HrRowJudge;
  dataQuality: "full" | "partial" | "limited" | "projection_preview";
}

export interface HrBoardGame {
  gamePk: number;
  matchup: string;
  gameTime: string;
  venue: string;
  status: string;
  environmentTag: "Hitter-Friendly" | "Pitcher-Friendly" | "Neutral";
  parkNote: string;
  weatherNote: string;
  rankedHitters: number;
  rows: HrBoardRow[];
}

export interface HrBoardResponse {
  date: string;
  gameCount: number;
  generatedAt: string;
  dataQuality: "full" | "partial" | "limited" | "projection_preview";
  disclaimer: string;
  games?: HrBoardGame[];
  candidates?: Array<Record<string, unknown>>;
  projectedCandidates?: Array<Record<string, unknown>>;
  previewMeta?: {
    previewLimit: number;
    eligiblePreviewPoolCount: number;
    scoredPreviewPoolCount: number;
    projectedPreviewCount: number;
  };
  rosterAudit?: {
    source: string;
    strictTeamVerification: boolean;
    warning: string;
  };
  debug?: {
    teamMismatchBlocked?: number;
    teamMismatchExamples?: Array<Record<string, unknown>>;
    confirmedLineupsLoaded?: number;
    projectedPreviewCount?: number;
    eligiblePreviewPoolCount?: number;
    scoredPreviewPoolCount?: number;
    previewPoolBeforeRegistryFilter?: number;
    previewPoolAfterSafetyFilter?: number;
    badPairingAuditBlocked?: Array<Record<string, unknown>>;
    missingStarChecks?: Array<Record<string, unknown>>;
  };
  note?: string;
}

export type SortKey =
  | "hrEdge"
  | "vouchScore"
  | "grade"
  | "pitcherVulnerability"
  | "bestOdds"
  | "dataConfidence"
  | "lineupSpot"
  | "weatherBoost";

export interface HrBoardFilterState {
  team: string;
  grade: string;
  risk: string;
  hotOnly: boolean;
  sneakyOnly: boolean;
  confirmedOnly: boolean;
  minPitcherVuln: number;
  search: string;
  sortKey: SortKey;
}
