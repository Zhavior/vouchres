/**
 * Handedness Split Score (Section 7)
 *
 * Formula:
 *   Split Power Edge = Hitter ISO vs Pitcher Hand - Hitter Overall ISO
 *
 * Multiplier bands:
 *   Split Edge > +.080        → 1.10
 *   Split Edge +.040 to +.080 → 1.06
 *   Split Edge -0.039 to +0.039 → 1.00
 *   Split Edge -0.040 to -0.080 → 0.94
 *   Split Edge < -.080        → 0.90
 */

import { HandednessInputs, HandednessResult } from "./types";
import { HANDEDNESS_BANDS } from "./constants";

export function calculateHandednessScore(inputs: HandednessInputs): HandednessResult {
  const splitEdge = inputs.hitterIsoVsHand - inputs.hitterOverallIso;

  // Find the matching band
  const band = HANDEDNESS_BANDS.find(b => splitEdge >= b.min)!;

  return {
    splitEdge: Math.round(splitEdge * 1000) / 1000,
    multiplier: band.multiplier,
    edge: band.label as "Positive" | "Neutral" | "Negative",
    label: getHandednessLabel(splitEdge, inputs.pitcherHrAllowedVsHand),
  };
}

function getHandednessLabel(splitEdge: number, pitcherHrAllowedVsHand: number): string {
  const pitcherVulnerable = pitcherHrAllowedVsHand > 1.20; // HR/9 > 1.20 = vulnerable
  if (splitEdge > 0.040 && pitcherVulnerable) {
    return "Strong platoon edge — hitter damages this hand, pitcher is vulnerable";
  }
  if (splitEdge > 0.040) {
    return "Positive handedness split — hitter damages this hand";
  }
  if (splitEdge < -0.040) {
    return "Negative handedness split — hitter struggles vs this hand";
  }
  return "Neutral handedness split";
}
