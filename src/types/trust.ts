/** Frontend contract for Trust Code. */

export type TrustLabel = "New Capper" | "Building Trust" | "Verified" | "High Trust" | "Elite Verified";

export interface VerifiedRecordSummary {
  wins: number;
  losses: number;
  pushes: number;
  total: number;
  winRate: number;
}

export interface TrustScore {
  subjectId: string;
  userTrustScore: number;
  capperTrustBadge: TrustLabel;
  verifiedRecordSummary: VerifiedRecordSummary;
  recentForm: string;
  bestSport: string;
  bestMarket: string;
  transparencyBadge: "Transparent" | "Partial" | "Unverified";
  factors: { label: string; value: string }[];
}

export interface VerifiedRecord {
  subjectId: string;
  badge: string;
  trustScore: number;
  record: string;
  winRate: number;
  recentForm: string;
  bestMarket: string;
  transparencyBadge: string;
  recentPicks: { pickId: string; selection: string; market: string; status: string; score: number }[];
}
