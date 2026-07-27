/**
 * Lineup Context Score (Section 9)
 *
 * Lineup Multiplier:
 *   1st = 1.08
 *   2nd = 1.06
 *   3rd = 1.04
 *   4th = 1.02
 *   5th = 1.00
 *   6th = 0.96
 *   7th = 0.93
 *   8th = 0.90
 *   9th = 0.88
 *
 * Penalties:
 *   Unconfirmed lineup = 0.85 multiplier
 *   Pinch-hit risk = 0.70 multiplier
 */

import { LineupInputs, LineupResult } from "./types";
import { LINEUP_MULTIPLIERS, UNCONFIRMED_LINEUP_PENALTY, PINCH_HIT_RISK_PENALTY } from "./constants";

export function calculateLineupScore(inputs: LineupInputs): LineupResult {
  let multiplier = 1.0;
  let warning: string | null = null;

  if (inputs.lineupSpot === null) {
    multiplier *= UNCONFIRMED_LINEUP_PENALTY;
    warning = "⚠️ Lineup not confirmed";
  } else {
    multiplier *= LINEUP_MULTIPLIERS[inputs.lineupSpot] ?? 1.0;

    if (inputs.lineupSpot >= 8) {
      warning = "⚠️ Batting 8th/9th — reduced PA opportunity";
    } else if (inputs.lineupSpot <= 2) {
      // No warning — top-of-order is good
    }
  }

  if (inputs.pinchHitRisk) {
    multiplier *= PINCH_HIT_RISK_PENALTY;
    warning = (warning ?? "") + (warning ? " " : "") + "⚠️ Pinch-hit risk";
  }

  const paBoost = multiplier - 1;

  return {
    multiplier: Math.round(multiplier * 1000) / 1000,
    lineupSpot: inputs.lineupSpot,
    confirmed: inputs.lineupConfirmed,
    paBoost: Math.round(paBoost * 1000) / 1000,
    label: getLineupLabel(inputs.lineupSpot, inputs.lineupConfirmed),
    warning,
  };
}

function getLineupLabel(spot: number | null, confirmed: boolean): string {
  if (spot === null) return "Lineup not yet confirmed";
  if (!confirmed) return `Batting ${ordinal(spot)} (unconfirmed)`;

  if (spot <= 2) return `✅ Top-of-order PA boost (batting ${ordinal(spot)})`;
  if (spot <= 5) return `Heart of the order (batting ${ordinal(spot)})`;
  if (spot <= 7) return `Middle of the order (batting ${ordinal(spot)})`;
  return `⚠️ Bottom of the order (batting ${ordinal(spot)})`;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
