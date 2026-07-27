import type { ConfidenceBreakdown, IntelligenceRisk } from "./index";

export type RecommendationTier =
  | "Elite"
  | "Strong"
  | "Watch"
  | "Pass";

export interface RecommendationResult {
  tier: RecommendationTier;
  title: string;
  summary: string;
}

export function buildRecommendation(
  confidence: ConfidenceBreakdown,
  risks: IntelligenceRisk[],
): RecommendationResult {
  const score =
    confidence.score -
    risks.filter(r => r.severity === "high").length * 12 -
    risks.filter(r => r.severity === "medium").length * 6;

  if (score >= 90) {
    return {
      tier: "Elite",
      title: "Elite Home Run Target",
      summary: "Aurora strongly supports this player today.",
    };
  }

  if (score >= 80) {
    return {
      tier: "Strong",
      title: "Strong Target",
      summary: "Favorable profile with manageable risk.",
    };
  }

  if (score >= 70) {
    return {
      tier: "Watch",
      title: "Worth Monitoring",
      summary: "Upside exists but risk is elevated.",
    };
  }

  return {
    tier: "Pass",
    title: "Pass",
    summary: "Current evidence does not justify a recommendation.",
  };
}
