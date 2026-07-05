/**
 * VouchEdge HR Engine — Tier Assignment
 *
 * Tier thresholds (your spec):
 *   97–100  → Elite
 *   92–96   → Strong
 *   85–91   → Watch
 *   75–84   → Sleeper
 *   < 75    → Fade
 *
 * These replace the previous Elite/Strong/Good/Sneaky/Avoid labeling.
 * Updated to match the sportsbook-grade tier naming used across all UI.
 */

import { HrTier, TierResult } from './types';

export const TIER_THRESHOLDS = {
  elite:   97,
  strong:  92,
  watch:   85,
  sleeper: 75,
} as const;

export function assignHrTier(score: number): TierResult {
  let tier: HrTier;
  let label: string;
  let description: string;

  if (score >= TIER_THRESHOLDS.elite) {
    tier = 'Elite';
    label = 'Elite HR Target';
    description = 'All major signals aligned — top probability, maximum edge';
  } else if (score >= TIER_THRESHOLDS.strong) {
    tier = 'Strong';
    label = 'Strong HR Target';
    description = 'Strong HR profile with favorable matchup and park conditions';
  } else if (score >= TIER_THRESHOLDS.watch) {
    tier = 'Watch';
    label = 'Watch — HR Candidate';
    description = 'Solid HR candidate with some mixed signals — worth monitoring';
  } else if (score >= TIER_THRESHOLDS.sleeper) {
    tier = 'Sleeper';
    label = 'Sleeper HR Target';
    description = 'Lower-probability HR with upside if matchup breaks right';
  } else {
    tier = 'Avoid';
    label = 'Fade';
    description = 'Insufficient signals — book likely has better price';
  }

  return { tier, label, description };
}
