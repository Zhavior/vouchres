/** Frontend contract for AI judge verdicts. */

export type ApprovalStatus = "Approved" | "Playable but risky" | "Needs more data" | "Avoid";
export type RiskLabel = "Safe" | "Balanced" | "Risky" | "Sneaky" | "Lotto";

export interface PickCandidate {
  pickId?: string;
  player?: string;
  team?: string;
  opponent?: string;
  market: string;
  selection?: string;
  score?: number;
  reasons?: string[];
  riskWarnings?: string[];
  isParlay?: boolean;
  legs?: number;
  dataQuality?: "full" | "partial" | "limited";
}

export interface JudgeVerdict {
  finalScore: number;
  approvalStatus: ApprovalStatus;
  riskLabel: RiskLabel;
  confidence: "Strong" | "Moderate" | "Speculative";
  judgeNotes: string[];
  whatCouldGoWrong: string[];
  missingData: string[];
  parlayAllowed: boolean;
  saferAlternative: string | null;
}
