/** Computes Trust Score + badge from a subject's verified ledger. */
import { TrustScoreResult, TrustLabel, VerifiedRecordSummary, TrustFactor } from "./trustTypes";
import { PickRecord } from "../results/resultTypes";
import { getCapperPicks, getUserPicks } from "./resultLedgerService";
import { TTLCache, TTL } from "../../lib/cache";
import { clamp } from "../intelligence/scoring";

const trustCache = new TTLCache<TrustScoreResult>(TTL.trust);

function summarize(picks: PickRecord[]): VerifiedRecordSummary {
  const graded = picks.filter((p) => p.status !== "pending");
  const wins = graded.filter((p) => p.status === "win").length;
  const losses = graded.filter((p) => p.status === "loss").length;
  const pushes = graded.filter((p) => p.status === "push").length;
  const decisive = wins + losses;
  return {
    wins,
    losses,
    pushes,
    total: graded.length,
    winRate: decisive ? Math.round((wins / decisive) * 100) : 0,
  };
}

function badge(score: number, verifiedCount: number): TrustLabel {
  if (verifiedCount < 3) return "New Capper";
  if (score >= 85) return "Elite Verified";
  if (score >= 72) return "High Trust";
  if (score >= 58) return "Verified";
  return "Building Trust";
}

function recentForm(picks: PickRecord[]): string {
  return (
    picks
      .filter((p) => p.status !== "pending")
      .slice(0, 5)
      .map((p) => (p.status === "win" ? "W" : p.status === "loss" ? "L" : "P"))
      .join("-") || "—"
  );
}

function topMarket(picks: PickRecord[]): string {
  const counts = new Map<string, number>();
  for (const p of picks) counts.set(p.market, (counts.get(p.market) ?? 0) + 1);
  let best = "—";
  let max = 0;
  for (const [m, c] of counts) if (c > max) { max = c; best = m; }
  return best;
}

function compute(subjectId: string, picks: PickRecord[]): TrustScoreResult {
  const summary = summarize(picks);
  const transparency = picks.length > 0 ? (picks.every((p) => (p.reasons?.length ?? 0) > 0) ? "Transparent" : "Partial") : "Unverified";

  // Score blends volume, win rate, transparency, and explanation quality.
  const volumePts = clamp(summary.total * 4, 0, 30);
  const winPts = clamp((summary.winRate - 45) * 0.9, -15, 30);
  const transparencyPts = transparency === "Transparent" ? 20 : transparency === "Partial" ? 8 : 0;
  const explanationPts = picks.length && picks.every((p) => (p.reasons?.length ?? 0) >= 2) ? 12 : 5;
  const score = clamp(Math.round(40 + volumePts + winPts + transparencyPts + explanationPts - 25), 1, 100);

  const factors: TrustFactor[] = [
    { label: "Verified picks", value: String(summary.total) },
    { label: "Record", value: `${summary.wins}-${summary.losses}-${summary.pushes}` },
    { label: "Win rate (graded)", value: `${summary.winRate}%` },
    { label: "Transparency", value: transparency },
  ];

  return {
    subjectId,
    userTrustScore: score,
    capperTrustBadge: badge(score, summary.total),
    verifiedRecordSummary: summary,
    recentForm: recentForm(picks),
    bestSport: "MLB",
    bestMarket: topMarket(picks),
    transparencyBadge: transparency,
    factors,
  };
}

export async function getCapperTrust(capperId: string): Promise<TrustScoreResult> {
  return trustCache.getOrSet(`capper:${capperId}`, async () => compute(capperId, await getCapperPicks(capperId)));
}

export async function getUserTrust(userId: string): Promise<TrustScoreResult> {
  return trustCache.getOrSet(`user:${userId}`, async () => compute(userId, await getUserPicks(userId)));
}

/** Clear cached trust so the next read recomputes (call after grading a pick). */
export function invalidateCapperTrust(capperId: string): void {
  trustCache.delete(`capper:${capperId}`);
}
export function invalidateUserTrust(userId: string): void {
  trustCache.delete(`user:${userId}`);
}
