/**
 * Profile Stats (Section 22)
 *
 * HR-specific user profile metrics. Don't just show win rate — HR win rate
 * will look low because HRs are rare. Show context.
 *
 * Stats:
 *   - Total HR Picks Posted
 *   - HR Hit Rate (won / total)
 *   - Average Pick Score
 *   - Hit Rate by Tier (Elite/Strong/Good/Sneaky/Avoid)
 *   - Best/Worst Tier (by hit rate vs expected)
 *   - Good Process Rate (% of picks with process score >= 70)
 *   - Lottery Parlays (count of 3+ leg parlays)
 *   - Parlay Risk Behavior (Conservative/Balanced/Aggressive/Reckless)
 *   - ROI (units won / units staked)
 */

import { HrProfileStats, HrTier, PickOutcome } from "./types";

export function calculateProfileStats(
  outcomes: PickOutcome[]
): HrProfileStats {
  if (outcomes.length === 0) {
    return emptyStats();
  }

  const totalHrPicks = outcomes.length;
  const wonPicks = outcomes.filter(o => o.result === "won").length;
  const hrHitRate = wonPicks / totalHrPicks;

  const averagePickScore =
    outcomes.reduce((sum, o) => sum + o.prediction.hrScore, 0) / totalHrPicks;

  // Hit rate by tier
  const hitRateByTier = calculateHitRateByTier(outcomes);

  // Best/worst tier (by hit rate vs expected)
  const { bestTier, worstTier } = findBestAndWorstTiers(hitRateByTier);

  // Good process rate
  // (lazy import to avoid circular dep — processScore imports from types only)
  const goodProcessRate = calculateGoodProcessRate(outcomes);

  // Lottery parlays — count outcomes where the pick was a 3+ leg parlay
  // (Note: this requires extending PickOutcome or tracking parlay outcomes separately.
  // For now, approximate by checking if the prediction's leg_type is parlay.)
  const lotteryParlays = outcomes.filter(
    o => (o.prediction as any).leg_type === "parlay"
  ).length;

  // Parlay risk behavior
  const parlayRiskBehavior = calculateParlayRiskBehavior(outcomes, lotteryParlays);

  // ROI
  const totalStaked = outcomes.length; // assume 1 unit per pick
  const totalWon = outcomes.reduce((sum, o) => {
    if (o.result === "won") return sum + 1.5; // avg odds ~2.5 → +1.5 units
    if (o.result === "lost") return sum - 1.0;
    return sum; // push/void
  }, 0);
  const roi = totalStaked > 0 ? totalWon / totalStaked : 0;

  return {
    totalHrPicks,
    hrHitRate: Math.round(hrHitRate * 1000) / 1000,
    averagePickScore: Math.round(averagePickScore * 10) / 10,
    hitRateByTier,
    bestTier,
    worstTier,
    goodProcessRate: Math.round(goodProcessRate * 1000) / 1000,
    lotteryParlays,
    parlayRiskBehavior,
    roi: Math.round(roi * 1000) / 1000,
  };
}

function calculateHitRateByTier(
  outcomes: PickOutcome[]
): Record<HrTier, number> {
  const tiers: HrTier[] = ["Elite", "Strong", "Good", "Sneaky", "Avoid"];
  const result = {} as Record<HrTier, number>;

  for (const tier of tiers) {
    const tierOutcomes = outcomes.filter(o => o.prediction.tier.tier === tier);
    if (tierOutcomes.length === 0) {
      result[tier] = 0;
    } else {
      const won = tierOutcomes.filter(o => o.result === "won").length;
      result[tier] = Math.round((won / tierOutcomes.length) * 1000) / 1000;
    }
  }

  return result;
}

function findBestAndWorstTiers(
  hitRateByTier: Record<HrTier, number>
): { bestTier: HrTier | null; worstTier: HrTier | null } {
  const expectedRates: Record<HrTier, number> = {
    Elite: 0.10,
    Strong: 0.08,
    Good: 0.06,
    Sneaky: 0.04,
    Avoid: 0.02,
  };

  let bestTier: HrTier | null = null;
  let worstTier: HrTier | null = null;
  let bestDelta = -Infinity;
  let worstDelta = Infinity;

  for (const tier of ["Elite", "Strong", "Good", "Sneaky", "Avoid"] as HrTier[]) {
    if (hitRateByTier[tier] === 0) continue; // no picks in this tier
    const delta = hitRateByTier[tier] - expectedRates[tier];
    if (delta > bestDelta) {
      bestDelta = delta;
      bestTier = tier;
    }
    if (delta < worstDelta) {
      worstDelta = delta;
      worstTier = tier;
    }
  }

  return { bestTier, worstTier };
}

function calculateGoodProcessRate(outcomes: PickOutcome[]): number {
  // Lazy require to avoid circular dep
  // In production, import at top of file
  const { calculateProcessScore } = require("./processScore");
  const scored = outcomes.map(o => calculateProcessScore(o));
  const goodProcess = scored.filter(s => s.score >= 70).length;
  return outcomes.length > 0 ? goodProcess / outcomes.length : 0;
}

function calculateParlayRiskBehavior(
  outcomes: PickOutcome[],
  lotteryParlays: number
): HrProfileStats["parlayRiskBehavior"] {
  const parlayRate = outcomes.length > 0 ? lotteryParlays / outcomes.length : 0;

  if (parlayRate === 0) return "Conservative";
  if (parlayRate < 0.10) return "Balanced";
  if (parlayRate < 0.25) return "Aggressive";
  return "Reckless";
}

function emptyStats(): HrProfileStats {
  return {
    totalHrPicks: 0,
    hrHitRate: 0,
    averagePickScore: 0,
    hitRateByTier: {
      Elite: 0,
      Strong: 0,
      Good: 0,
      Sneaky: 0,
      Avoid: 0,
    },
    bestTier: null,
    worstTier: null,
    goodProcessRate: 0,
    lotteryParlays: 0,
    parlayRiskBehavior: "Conservative",
    roi: 0,
  };
}
