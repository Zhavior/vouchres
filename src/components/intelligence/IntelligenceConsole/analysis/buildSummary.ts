import type {
  ConfidenceBreakdown,
  IntelligenceRisk,
  RecommendationResult,
} from "./index";

export interface SummaryResult {
  headline: string;
  body: string;
}

export function buildSummary(
  recommendation: RecommendationResult,
  confidence: ConfidenceBreakdown,
  risks: IntelligenceRisk[],
): SummaryResult {
  const topPositive =
    confidence.factors.find(f => f.direction === "positive")?.label ??
    "overall profile";

  const topRisk =
    risks[0]?.title ?? "no major risk signals";

  return {
    headline: recommendation.title,
    body: `${recommendation.summary} Primary strength: ${topPositive}. Primary concern: ${topRisk}.`,
  };
}
