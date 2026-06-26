/** Builds a frontend-ready verified record summary for a capper/user. */
import { getCapperTrust } from "./trustScoreService";
import { getCapperPicks } from "./resultLedgerService";
import { PickRecord } from "../results/resultTypes";

export interface VerifiedRecard {
  subjectId: string;
  badge: string;
  trustScore: number;
  record: string; // "W-L-P"
  winRate: number;
  recentForm: string;
  bestMarket: string;
  transparencyBadge: string;
  recentPicks: Pick<PickRecord, "pickId" | "selection" | "market" | "status" | "score">[];
}

export function getVerifiedRecord(capperId: string): VerifiedRecard {
  const trust = getCapperTrust(capperId);
  const s = trust.verifiedRecordSummary;
  return {
    subjectId: capperId,
    badge: trust.capperTrustBadge,
    trustScore: trust.userTrustScore,
    record: `${s.wins}-${s.losses}-${s.pushes}`,
    winRate: s.winRate,
    recentForm: trust.recentForm,
    bestMarket: trust.bestMarket,
    transparencyBadge: trust.transparencyBadge,
    recentPicks: getCapperPicks(capperId)
      .slice(0, 8)
      .map((p) => ({ pickId: p.pickId, selection: p.selection, market: p.market, status: p.status, score: p.score })),
  };
}
