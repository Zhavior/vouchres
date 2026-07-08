/**
 * Layer 9 — Swing Decisions
 *
 * Good swing decisions improve HR opportunities by increasing the rate
 * of contact on pitches in hittable zones while avoiding chasing waste.
 *
 * Swing Decision Score =
 *   (ZoneContact% × 0.35)
 *   + ((1 − Chase%) × 0.30)
 *   + ((1 − Whiff%) × 0.20)
 *   + (Contact% × 0.15)
 *
 * All inputs are fractions (0–1).
 * Output is 0–100.
 */

export interface SwingDecisionInputs {
  /** Chase rate — % of pitches outside zone swung at (0–1) */
  chaseRate: number;
  /** Whiff rate — % of swings that miss (0–1) */
  whiffRate: number;
  /** Contact rate — % of swings that make contact (0–1) */
  contactRate: number;
  /** Zone contact rate — contact% on pitches in the strike zone (0–1) */
  zoneContactRate: number;
}

export interface SwingDecisionResult {
  score: number;       // 0–100
  chaseRate: number;
  whiffRate: number;
  contactRate: number;
  zoneContactRate: number;
  edge: 'Positive' | 'Neutral' | 'Negative';
  label: string;
}

/** League-average baselines (2024 Statcast) */
const LEAGUE = {
  chaseRate: 0.291,
  whiffRate: 0.253,
  contactRate: 0.769,
  zoneContactRate: 0.855,
} as const;

const WEIGHTS = {
  zoneContact: 0.35,
  noChase: 0.30,
  noWhiff: 0.20,
  contact: 0.15,
} as const;

/** Normalise a stat to 0–1 relative to a reasonable range, clamped. */
function norm(value: number, worst: number, best: number): number {
  return Math.max(0, Math.min(1, (value - worst) / (best - worst)));
}

export function calculateSwingDecisionScore(inputs: SwingDecisionInputs): SwingDecisionResult {
  // ZoneContact%: 0.75 (bad) → 0.95 (elite)
  const zoneContactNorm = norm(inputs.zoneContactRate, 0.75, 0.95);
  // Chase%: 0.40 (bad/high) → 0.15 (elite/low) — invert
  const noChaseNorm = norm(1 - inputs.chaseRate, 1 - 0.40, 1 - 0.15);
  // Whiff%: 0.40 (bad) → 0.12 (elite) — invert
  const noWhiffNorm = norm(1 - inputs.whiffRate, 1 - 0.40, 1 - 0.12);
  // Contact%: 0.60 (bad) → 0.90 (elite)
  const contactNorm = norm(inputs.contactRate, 0.60, 0.90);

  const raw =
    zoneContactNorm * WEIGHTS.zoneContact +
    noChaseNorm     * WEIGHTS.noChase +
    noWhiffNorm     * WEIGHTS.noWhiff +
    contactNorm     * WEIGHTS.contact;

  const score = Math.round(raw * 100);

  // Simple league-average comparison for edge label
  const leagueMeanScore = Math.round(
    (norm(LEAGUE.zoneContactRate, 0.75, 0.95) * WEIGHTS.zoneContact +
     norm(1 - LEAGUE.chaseRate, 1 - 0.40, 1 - 0.15) * WEIGHTS.noChase +
     norm(1 - LEAGUE.whiffRate, 1 - 0.40, 1 - 0.12) * WEIGHTS.noWhiff +
     norm(LEAGUE.contactRate, 0.60, 0.90) * WEIGHTS.contact) * 100,
  );

  const edge: SwingDecisionResult['edge'] =
    score >= leagueMeanScore + 10 ? 'Positive' :
    score <= leagueMeanScore - 10 ? 'Negative' :
    'Neutral';

  const label =
    score >= 80 ? '🎯 Elite Zone Discipline' :
    score >= 65 ? '✅ Above-Avg Swing Decisions' :
    score >= 50 ? '➡️ Average Swing Decisions' :
    score >= 35 ? '⚠️ Below-Avg Discipline' :
    '🚨 High Chase / Whiff Rate';

  return {
    score,
    chaseRate: inputs.chaseRate,
    whiffRate: inputs.whiffRate,
    contactRate: inputs.contactRate,
    zoneContactRate: inputs.zoneContactRate,
    edge,
    label,
  };
}
