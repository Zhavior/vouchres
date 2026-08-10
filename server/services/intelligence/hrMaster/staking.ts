import type { ConfidenceLabel, StakingOutput } from "./types";
import { HR_MASTER_MODEL } from "./modelConfig";

export function computeStaking(args: {
  p_model: number;
  decimal_odds: number;
  confidence: ConfidenceLabel;
  expected_value: number;
  statusAllowsBet: boolean;
}): StakingOutput {
  const { p_model, decimal_odds, confidence, expected_value, statusAllowsBet } = args;

  if (!statusAllowsBet || expected_value <= 0) {
    return {
      raw_fractional_kelly: 0,
      risk_adjusted_fractional_kelly: 0,
      unit_recommendation: 0,
    };
  }

  const rawKelly =
    ((p_model * decimal_odds - 1) / (decimal_odds - 1)) * HR_MASTER_MODEL.kelly_multiplier;

  let riskAdjusted = rawKelly;
  if (confidence === "MEDIUM") riskAdjusted *= 0.6;
  if (confidence === "LOW") riskAdjusted = 0;

  riskAdjusted = Math.max(0, Math.min(riskAdjusted, HR_MASTER_MODEL.max_unit_recommendation));

  return {
    raw_fractional_kelly: Math.max(0, rawKelly),
    risk_adjusted_fractional_kelly: riskAdjusted,
    unit_recommendation: Math.round(riskAdjusted * 100) / 100,
  };
}
