/** Trust Code shapes. */

export type TrustLabel = "New Capper" | "Building Trust" | "Verified" | "High Trust" | "Elite Verified";

export interface VerifiedRecordSummary {
  wins: number;
  losses: number;
  pushes: number;
  total: number;
  winRate: number; // 0-100, graded picks only
}

export interface TrustFactor {
  label: string;
  value: string;
}

export interface TrustScoreResult {
  subjectId: string;
  userTrustScore: number; // 1-100
  capperTrustBadge: TrustLabel;
  verifiedRecordSummary: VerifiedRecordSummary;
  recentForm: string; // e.g. "W-W-L-W-L"
  bestSport: string;
  bestMarket: string;
  transparencyBadge: "Transparent" | "Partial" | "Unverified";
  factors: TrustFactor[];
}
