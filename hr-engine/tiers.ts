/**
 * Tier Assignment (Section 2)
 *
 * Score tiers:
 *   90-100 = Elite HR Target
 *   80-89  = Strong HR Target
 *   70-79  = Good HR Target
 *   60-69  = Sneaky HR Target
 *   Below 60 = Weak / Avoid
 */

import { HrTier, TierResult } from "./types";
import { TIER_THRESHOLDS } from "./constants";

export function assignHrTier(score: number): TierResult {
  let tier: HrTier;
  let label: string;
  let description: string;

  if (score >= TIER_THRESHOLDS.elite) {
    tier = "Elite";
    label = "Elite HR Target";
    description = "Top-tier HR opportunity — multiple strong signals align";
  } else if (score >= TIER_THRESHOLDS.strong) {
    tier = "Strong";
    label = "Strong HR Target";
    description = "Strong HR profile with favorable matchup conditions";
  } else if (score >= TIER_THRESHOLDS.good) {
    tier = "Good";
    label = "Good HR Target";
    description = "Solid HR candidate with some mixed signals";
  } else if (score >= TIER_THRESHOLDS.sneaky) {
    tier = "Sneaky";
    label = "Sneaky HR Target";
    description = "Lower-probability HR with upside if matchup breaks right";
  } else {
    tier = "Avoid";
    label = "Weak / Avoid";
    description = "Insufficient HR signals — probability too low to recommend";
  }

  return { tier, label, description };
}
