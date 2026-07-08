/**
 * Strikeout Penalty (Section 10)
 *
 * Formula:
 *   K Penalty = Batter K% vs Pitcher Hand × Pitcher K%
 *
 * Then:
 *   Adjusted HR Score = HR Score - (K Penalty × 100)
 *
 * Labels:
 *   ✅ Low K Risk           — K penalty < 5%
 *   ⚠️ Swing-and-Miss Risk  — K penalty 5-8%
 *   🚨 High K Penalty       — K penalty > 8%
 *
 * The penalty reflects that power doesn't matter if the hitter can't
 * put the ball in play.
 */

import { StrikeoutPenaltyInputs, StrikeoutPenaltyResult } from "./types";
import { K_PENALTY_THRESHOLDS, STRIKEOUT_PENALTY_WEIGHT } from "./constants";

export function calculateStrikeoutPenalty(
  inputs: StrikeoutPenaltyInputs,
  rawHrScore: number
): StrikeoutPenaltyResult {
  const penalty = inputs.batterKRate * inputs.pitcherKRate;
  const scoreDeduction = penalty * 100 * STRIKEOUT_PENALTY_WEIGHT;
  const adjustedScore = Math.max(0, rawHrScore - scoreDeduction);

  let riskLevel: StrikeoutPenaltyResult["riskLevel"];
  let label: string;

  if (penalty < K_PENALTY_THRESHOLDS.low) {
    riskLevel = "Low";
    label = "✅ Low K Risk";
  } else if (penalty < K_PENALTY_THRESHOLDS.medium) {
    riskLevel = "Medium";
    label = "⚠️ Swing-and-Miss Risk";
  } else {
    riskLevel = "High";
    label = "🚨 High K Penalty";
  }

  return {
    penalty: Math.round(penalty * 1000) / 1000,
    adjustedScore: Math.round(adjustedScore * 10) / 10,
    riskLevel,
    label,
  };
}
