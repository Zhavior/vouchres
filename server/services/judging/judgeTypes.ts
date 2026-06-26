/** Shared types for the AI judge system. */

export type ApprovalStatus = "Approved" | "Playable but risky" | "Needs more data" | "Avoid";
export type RiskLabel = "Safe" | "Balanced" | "Risky" | "Sneaky" | "Lotto";

/** The candidate pick a judge evaluates. Loose by design so any engine output fits. */
export interface PickCandidate {
  pickId?: string;
  player?: string;
  team?: string;
  opponent?: string;
  market: string;
  selection?: string;
  score?: number; // engine confidence/HR/edge score 1-100
  reasons?: string[];
  riskWarnings?: string[];
  isParlay?: boolean;
  legs?: number;
  dataQuality?: "full" | "partial" | "limited";
}

export interface JudgeVerdict {
  finalScore: number; // 1-100
  approvalStatus: ApprovalStatus;
  riskLabel: RiskLabel;
  confidence: "Strong" | "Moderate" | "Speculative";
  judgeNotes: string[];
  whatCouldGoWrong: string[];
  missingData: string[];
  parlayAllowed: boolean;
  saferAlternative: string | null;
}

export interface SubJudgeResult {
  judge: string;
  score: number; // 1-100
  notes: string[];
  flags: string[];
}
