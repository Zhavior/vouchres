/**
 * Confidence Multiplier (Section 11)
 *
 * Final Confidence =
 *   Data Quality
 *   × Lineup Certainty
 *   × Sample Size Stability
 *   × Weather Certainty
 *   × Role Certainty
 *
 * Multipliers:
 *   Confirmed lineup = 1.00, Unconfirmed = 0.85
 *   Large sample = 1.00, Medium = 0.92, Small = 0.85
 *   Weather certain = 1.00, Uncertain = 0.90
 *   No pinch-hit risk = 1.00, Pinch-hit risk = 0.70
 *   No injury risk = 1.00, Injury risk = 0.65
 *   Data quality full = 1.00, Partial = 0.92, Limited = 0.80
 */

import { ConfidenceInputs, ConfidenceResult } from "./types";
import { CONFIDENCE_MULTIPLIERS } from "./constants";

export function calculateConfidence(inputs: ConfidenceInputs): ConfidenceResult {
  const reasons: string[] = [];
  let multiplier = 1.0;

  // Data quality
  const dataQualityMult = (() => {
    switch (inputs.dataQuality) {
      case "full":    return CONFIDENCE_MULTIPLIERS.dataQualityFull;
      case "partial": return CONFIDENCE_MULTIPLIERS.dataQualityPartial;
      case "limited": return CONFIDENCE_MULTIPLIERS.dataQualityLimited;
    }
  })();
  multiplier *= dataQualityMult;
  if (inputs.dataQuality !== "full") {
    reasons.push(`Data quality is ${inputs.dataQuality}`);
  }

  // Lineup certainty
  if (inputs.lineupConfirmed) {
    multiplier *= CONFIDENCE_MULTIPLIERS.lineupConfirmed;
  } else {
    multiplier *= CONFIDENCE_MULTIPLIERS.lineupUnconfirmed;
    reasons.push("Lineup not yet confirmed");
  }

  // Sample size
  switch (inputs.recentSampleSize) {
    case "large":
      multiplier *= CONFIDENCE_MULTIPLIERS.largeSample;
      break;
    case "medium":
      multiplier *= CONFIDENCE_MULTIPLIERS.mediumSample;
      reasons.push("Recent sample is medium-sized");
      break;
    case "small":
      multiplier *= CONFIDENCE_MULTIPLIERS.smallSample;
      reasons.push("Recent barrel sample is small");
      break;
  }

  // Weather uncertainty
  if (inputs.weatherUncertainty) {
    multiplier *= CONFIDENCE_MULTIPLIERS.weatherUncertain;
    reasons.push("Weather forecast is uncertain");
  }

  // Pinch-hit risk
  if (inputs.pinchHitRisk) {
    multiplier *= CONFIDENCE_MULTIPLIERS.pinchHitRisk;
    reasons.push("Pinch-hit risk in late innings");
  }

  // Injury or rest risk
  if (inputs.injuryOrRestRisk) {
    multiplier *= CONFIDENCE_MULTIPLIERS.injuryRisk;
    reasons.push("Injury or rest risk");
  }

  return {
    multiplier: Math.round(multiplier * 1000) / 1000,
    level: getConfidenceLevel(multiplier),
    reasons: reasons.length > 0 ? reasons : ["Multiple signals agree, lineup confirmed"],
  };
}

function getConfidenceLevel(multiplier: number): ConfidenceResult["level"] {
  if (multiplier >= 0.95) return "High";
  if (multiplier >= 0.85) return "Medium-High";
  if (multiplier >= 0.75) return "Medium";
  if (multiplier >= 0.60) return "Low";
  return "Lottery";
}
