export type HRTier = "ELITE" | "STRONG" | "GOOD" | "PASS";

export interface HRScoreInput {
  barrelRate: number;
  hardHitRate: number;
  pitcherHR9: number;
  parkFactor: number;
  weatherBoost: number;
  recentForm: number;
  matchupEdge: number;
}

export interface HREvaluation {
  score: number;
  tier: HRTier;
}

export function calculateHRScore(input: HRScoreInput): HREvaluation {
  const score =
    input.barrelRate * 0.30 +
    input.hardHitRate * 0.20 +
    input.pitcherHR9 * 0.15 +
    input.parkFactor * 0.10 +
    input.weatherBoost * 0.10 +
    input.recentForm * 0.10 +
    input.matchupEdge * 0.05;

  const normalized = Math.max(0, Math.min(1, score));

  let tier: HRTier = "PASS";

  if (normalized >= 0.8) tier = "ELITE";
  else if (normalized >= 0.7) tier = "STRONG";
  else if (normalized >= 0.6) tier = "GOOD";

  return {
    score: Number(normalized.toFixed(3)),
    tier,
  };
}
