/**
 * Hitter Power Score (Section 3)
 *
 * Formula:
 *   Hitter Power Score =
 *     (ISO Percentile × 0.30)
 *     + (Barrel% Percentile × 0.30)
 *     + (Hard-Hit% Percentile × 0.20)
 *     + (HR/FB Percentile × 0.20)
 *
 * Used on: HR Board, Player Research, AI Picks, Parlay Scanner, Vouch Cards, Profile History
 */

import { HitterPowerInputs, HitterPowerResult } from "./types";
import { HITTER_POWER_WEIGHTS } from "./constants";

export function calculateHitterPowerScore(inputs: HitterPowerInputs): HitterPowerResult {
  const score =
    inputs.isoPercentile * HITTER_POWER_WEIGHTS.iso +
    inputs.barrelPercentile * HITTER_POWER_WEIGHTS.barrel +
    inputs.hardHitPercentile * HITTER_POWER_WEIGHTS.hardHit +
    inputs.hrFbPercentile * HITTER_POWER_WEIGHTS.hrFb;

  return {
    score: Math.round(score * 10) / 10,
    iso: inputs.iso,
    barrelRate: inputs.barrelRate,
    hardHitRate: inputs.hardHitRate,
    hrFbRate: inputs.hrFbRate,
    label: getPowerLabel(score),
  };
}

function getPowerLabel(score: number): string {
  if (score >= 85) return "Elite raw power profile";
  if (score >= 70) return "Above-average power";
  if (score >= 55) return "Average power";
  if (score >= 40) return "Below-average power";
  return "Limited power profile";
}
