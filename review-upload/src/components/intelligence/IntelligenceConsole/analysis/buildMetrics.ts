import type { IntelligenceMetric } from "../types";

export interface BuildMetricsInput {
  score: number | null | undefined;
  edge: number | null | undefined;
  confidence: number | null | undefined;
}

export function buildMetrics({
  score,
  edge,
  confidence,
}: BuildMetricsInput): IntelligenceMetric[] {
  const metrics: IntelligenceMetric[] = [];

  if (typeof score === "number" && Number.isFinite(score)) {
    metrics.push({
      label: "HR Score",
      value: String(score),
    });
  }

  if (typeof edge === "number" && Number.isFinite(edge)) {
    metrics.push({
      label: "Edge",
      value: `${edge > 0 ? "+" : ""}${edge}%`,
    });
  }

  if (typeof confidence === "number" && Number.isFinite(confidence)) {
    metrics.push({
      label: "Confidence",
      value: `${confidence}%`,
    });
  }

  return metrics;
}
