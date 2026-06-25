/**
 * Parlay Scanner (Section 15)
 *
 * For HR parlays:
 *   Parlay Probability = Leg 1 Probability × Leg 2 Probability × ... × Leg N
 *
 * Risk tiers:
 *   Single HR:        Reasonable Risk
 *   2-Leg HR Parlay:  High Risk
 *   3-Leg HR Parlay:  Very High Risk
 *   4+ HR Parlay:     Lottery Risk
 *
 * Also flags:
 *   - Correlation risk: legs from the same game (correlated outcomes)
 *   - Overexposure: multiple legs on the same team or same pitcher
 *   - Leg quality: average score of all legs
 */

import { HrPrediction, ParlayLeg, ParlayScanResult } from "./types";

export function scanParlay(legs: HrPrediction[]): ParlayScanResult {
  if (legs.length === 0) {
    return emptyResult();
  }

  // Detect correlated legs (same game)
  const parlayLegs: ParlayLeg[] = legs.map((pred, i) => ({
    prediction: pred,
    correlatedWith: legs
      .filter((other, j) => i !== j && other.gameId === pred.gameId)
      .map((_, j) => `leg-${j}`),
  }));

  // Combined probability = product of individual probabilities
  const combinedProbability = legs.reduce(
    (product, leg) => product * leg.hrProbability,
    1
  );

  // Combined score = confidence-weighted average
  const confidenceWeights = legs.map(l => confidenceToWeight(l.confidence.level));
  const totalWeight = confidenceWeights.reduce((a, b) => a + b, 0);
  const combinedScore =
    legs.reduce((sum, leg, i) => sum + leg.hrScore * confidenceWeights[i], 0) /
    totalWeight;

  // Risk tier based on leg count
  let riskTier: ParlayScanResult["riskTier"];
  let riskLabel: string;
  if (legs.length === 1) {
    riskTier = "Reasonable";
    riskLabel = "Single HR: Reasonable Risk";
  } else if (legs.length === 2) {
    riskTier = "High";
    riskLabel = "2-Leg HR Parlay: High Risk";
  } else if (legs.length === 3) {
    riskTier = "Very High";
    riskLabel = "3-Leg HR Parlay: Very High Risk";
  } else {
    riskTier = "Lottery";
    riskLabel = `${legs.length}-HR Parlay: Lottery Risk`;
  }

  // Correlation warning
  const correlatedCount = parlayLegs.filter(l => l.correlatedWith.length > 0).length;
  const correlationWarning =
    correlatedCount > 0
      ? `${correlatedCount} leg(s) share the same game — outcomes are correlated. ` +
        `If one leg's game goes sideways (weather delay, pitcher change), the other legs in that game are affected too.`
      : null;

  // Overexposure: same team across multiple legs
  const teamCounts = new Map<string, number>();
  for (const leg of legs) {
    teamCounts.set(leg.team, (teamCounts.get(leg.team) ?? 0) + 1);
  }
  const maxTeamExposure = Math.max(...teamCounts.values());
  const overexposureWarning =
    maxTeamExposure >= 3
      ? `Overexposed to ${[...teamCounts.entries()].find(([_, c]) => c === maxTeamExposure)![0]} — ${maxTeamExposure} of ${legs.length} legs rely on the same team.`
      : maxTeamExposure === 2 && legs.length >= 3
        ? `Mild overexposure — 2 legs on the same team.`
        : null;

  // Leg quality
  const avgScore = legs.reduce((sum, leg) => sum + leg.hrScore, 0) / legs.length;
  let legQuality: ParlayScanResult["legQuality"];
  if (avgScore >= 75) legQuality = "Strong";
  else if (avgScore >= 60) legQuality = "Mixed";
  else legQuality = "Weak";

  // Generate explanation
  const explanation = generateExplanation(
    legs,
    combinedProbability,
    riskTier,
    correlationWarning,
    overexposureWarning
  );

  return {
    legs: parlayLegs,
    combinedProbability: Math.round(combinedProbability * 1000000) / 1000000,
    combinedScore: Math.round(combinedScore * 10) / 10,
    riskTier,
    riskLabel,
    correlationWarning,
    overexposureWarning,
    legQuality,
    explanation,
  };
}

function confidenceToWeight(level: string): number {
  switch (level) {
    case "High":         return 1.0;
    case "Medium-High":  return 0.85;
    case "Medium":       return 0.70;
    case "Low":          return 0.50;
    case "Lottery":      return 0.30;
    default:             return 0.70;
  }
}

function generateExplanation(
  legs: HrPrediction[],
  combinedProb: number,
  riskTier: string,
  correlationWarning: string | null,
  overexposureWarning: string | null
): string {
  const legNames = legs.map(l => l.playerName).join(", ");
  const combinedPct = (combinedProb * 100).toFixed(4);

  let expl = `Your parlay includes ${legs.length} HR leg${legs.length > 1 ? "s" : ""}: ${legNames}.\n\n`;

  if (legs.length === 1) {
    expl += `Single HR bets are reasonable risk — even elite HR targets hit only ~8-10% of the time, but the math is sound. `;
  } else if (legs.length === 2) {
    expl += `2-leg HR parlays are high-risk. Each leg is independently ~7-9% likely, but combined: ${combinedPct}%. `;
    expl += `The math compounds quickly — even with two strong targets, the parlay is unlikely to cash. `;
  } else if (legs.length === 3) {
    expl += `3-leg HR parlays are very high-risk. Combined probability: ${combinedPct}%. `;
    expl += `Your individual legs may be strong, but the combined HR parlay probability is extremely low because HRs are rare events. `;
  } else {
    expl += `${legs.length}-leg HR parlays are lottery-level risk. Combined probability: ${combinedPct}%. `;
    expl += `Even with all elite targets, this is functionally a lottery ticket. `;
  }

  if (correlationWarning) {
    expl += `\n\n${correlationWarning}`;
  }
  if (overexposureWarning) {
    expl += `\n\n${overexposureWarning}`;
  }

  expl += `\n\nThis is probability-based research for entertainment — not betting advice.`;

  return expl;
}

function emptyResult(): ParlayScanResult {
  return {
    legs: [],
    combinedProbability: 0,
    combinedScore: 0,
    riskTier: "Reasonable",
    riskLabel: "Add legs to scan",
    correlationWarning: null,
    overexposureWarning: null,
    legQuality: "Weak",
    explanation: "No legs yet.",
  };
}
