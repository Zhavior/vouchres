import type {
  IntelligenceEvidence,
  IntelligenceTier,
} from "../types";

export interface ConfidenceFactor {
  label: string;
  impact: number;
  direction: "positive" | "negative";
  reason: string;
}

export interface ConfidenceBreakdown {
  score: number;
  factors: ConfidenceFactor[];
}

interface BuildConfidenceInput {
  score: number;
  edge: number | null;
  confidence: number;
  tier: IntelligenceTier;
  evidence: IntelligenceEvidence[];
}

export function buildConfidence({
  score,
  edge,
  confidence,
  tier,
  evidence,
}: BuildConfidenceInput): ConfidenceBreakdown {
  const factors: ConfidenceFactor[] = [];

  if (score >= 90) {
    factors.push({
      label: "HR Score",
      impact: 15,
      direction: "positive",
      reason: "Elite projected HR profile",
    });
  }

  if ((edge ?? 0) >= 20) {
    factors.push({
      label: "Edge",
      impact: 12,
      direction: "positive",
      reason: "Strong model edge",
    });
  }

  if (tier === "S") {
    factors.push({
      label: "Tier",
      impact: 10,
      direction: "positive",
      reason: "Top Aurora tier",
    });
  }

  const negatives = evidence.filter(e => e.strength === "negative").length;

  if (negatives > 0) {
    factors.push({
      label: "Risk Signals",
      impact: negatives * -4,
      direction: "negative",
      reason: "Negative evidence detected",
    });
  }

  return {
    score: confidence,
    factors,
  };
}
