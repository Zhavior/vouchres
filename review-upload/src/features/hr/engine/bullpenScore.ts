/**
 * Bullpen Weakness Score (Section 10b — late-game PAs)
 *
 * For late-game PAs (7th inning onward), the hitter faces the bullpen
 * instead of the starter. This module produces a multiplier reflecting
 * bullpen HR weakness.
 *
 * Heuristic:
 *   - Starter expected innings: 5.5 (typical) → ~1.5 innings of bullpen exposure
 *   - Bullpen HR/9 vs league average → multiplier
 *   - Bullpen fatigue (back-to-back games, multiple innings previous day) → boost
 */

import { BullpenInputs, BullpenResult } from "./types";
import { LEAGUE_AVERAGES } from "./constants";

export function calculateBullpenScore(inputs: BullpenInputs): BullpenResult {
  // Compare bullpen HR/9 to league average
  const hr9Ratio = inputs.bullpenHr9 / LEAGUE_AVERAGES.pitcherHr9;

  // Compare barrel allowed to league
  const barrelRatio = inputs.bullpenBarrelAllowed / LEAGUE_AVERAGES.pitcherBarrelAllowed;

  // Average of the two ratios, then fatigue boost
  const baseMultiplier = (hr9Ratio + barrelRatio) / 2;
  const fatigueBoost = 1 + inputs.bullpenFatigue * 0.10;  // Up to +10% if exhausted

  // Weight by how many innings the bullpen will throw
  // If starter goes 7+, bullpen only throws 2 innings (less impact)
  // If starter goes 5, bullpen throws 4 innings (more impact)
  const bullpenInnings = Math.max(0, 9 - inputs.starterExpectedInnings);
  const weightFactor = Math.min(1, bullpenInnings / 4);  // 4+ innings = full weight

  const multiplier = 1 + (baseMultiplier - 1) * weightFactor * fatigueBoost;

  // Clamp
  const clampedMultiplier = Math.max(0.85, Math.min(1.20, multiplier));

  let riskLevel: BullpenResult["riskLevel"];
  if (clampedMultiplier >= 1.10) riskLevel = "High";
  else if (clampedMultiplier >= 1.00) riskLevel = "Medium";
  else riskLevel = "Low";

  return {
    multiplier: Math.round(clampedMultiplier * 1000) / 1000,
    riskLevel,
    label: getBullpenLabel(clampedMultiplier, inputs.bullpenFatigue),
  };
}

function getBullpenLabel(multiplier: number, fatigue: number): string {
  if (multiplier >= 1.10 && fatigue > 0.5) {
    return "Tired, vulnerable bullpen — late-game HR opportunity";
  }
  if (multiplier >= 1.10) return "Weak bullpen — late-game HR boost likely";
  if (multiplier >= 1.00) return "Average bullpen";
  return "Strong bullpen — late-game HR suppression";
}
