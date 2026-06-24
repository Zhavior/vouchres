/**
 * Deterministic scoring helpers. Same inputs → same score, so reports are stable
 * and cacheable (no per-call randomness). Real Statcast inputs can replace the
 * seeded placeholders later without changing the engine interfaces.
 */

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Stable hash of a string → 0..1. */
export function seed01(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // map to 0..1
  return ((h >>> 0) % 100000) / 100000;
}

/** Deterministic integer in [min,max] derived from a seed key. */
export function seededInt(key: string, min: number, max: number): number {
  return Math.round(min + seed01(key) * (max - min));
}

export type RiskTier = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";

export function riskTierFromScore(score: number): RiskTier {
  if (score >= 78) return "LOW";
  if (score >= 60) return "MEDIUM";
  if (score >= 42) return "HIGH";
  return "EXTREME";
}

export type HrLabel = "Strong" | "Playable" | "Sneaky" | "Lotto" | "Avoid";

export function hrLabelFromScore(score: number, sneaky = false): HrLabel {
  if (sneaky) return score >= 55 ? "Sneaky" : "Lotto";
  if (score >= 80) return "Strong";
  if (score >= 65) return "Playable";
  if (score >= 50) return "Sneaky";
  if (score >= 38) return "Lotto";
  return "Avoid";
}

export type ConfidenceBand = "Strong" | "Moderate" | "Speculative";
export function confidenceFromScore(score: number): ConfidenceBand {
  if (score >= 75) return "Strong";
  if (score >= 58) return "Moderate";
  return "Speculative";
}
