import type {
  IntelligenceAnalysis,
  IntelligenceTier,
} from "./types";
import { buildConfidence, buildEvidence, buildMetrics, buildRisks } from "./analysis";

interface BuildPlayerIntelligenceAnalysisInput {
  score: number | null | undefined;
  edge: number | null | undefined;
  confidence: number | null | undefined;
  pitcherName: string | null | undefined;
  opponent: string | null | undefined;
  tier: IntelligenceTier | null | undefined;
}

function isFiniteNumber(
  value: number | null | undefined,
): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function buildPlayerIntelligenceAnalysis({
  score,
  edge,
  confidence,
  pitcherName,
  opponent,
  tier,
}: BuildPlayerIntelligenceAnalysisInput): IntelligenceAnalysis {
  const evidence = buildEvidence({
    score,
    edge,
    confidence,
    pitcherName,
    opponent,
    tier,
  });

  const confidenceBreakdown = buildConfidence({
  score,
  edge,
  confidence,
  tier,
  evidence,
});

const risks = buildRisks(evidence);

return {
    score: isFiniteNumber(score) ? score : null,
    edge: isFiniteNumber(edge) ? edge : null,
    confidence: isFiniteNumber(confidence) ? confidence : null,
    pitcherName: pitcherName || null,
    opponent: opponent || null,
    tier: tier || null,
    metrics: [
      ...(isFiniteNumber(score)
        ? [
            {
              label: "HR Score",
              value: score,
              emphasis: true,
            },
          ]
        : []),
      ...(isFiniteNumber(edge)
        ? [
            {
              label: "Projected Edge",
              value: `${edge > 0 ? "+" : ""}${edge}%`,
              emphasis: true,
            },
          ]
        : []),
      ...(isFiniteNumber(confidence)
        ? [
            {
              label: "Confidence",
              value: `${confidence}%`,
            },
          ]
        : []),
    ],
    evidence,
    confidenceBreakdown,
    risks,
  };
}
