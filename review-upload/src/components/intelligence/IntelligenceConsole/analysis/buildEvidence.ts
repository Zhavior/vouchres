import type {
  IntelligenceEvidence,
  IntelligenceTier,
} from "../types";

export interface BuildEvidenceInput {
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

export function buildEvidence({
  score,
  edge,
  confidence,
  pitcherName,
  opponent,
}: BuildEvidenceInput): IntelligenceEvidence[] {
  const evidence: IntelligenceEvidence[] = [];

  if (isFiniteNumber(score)) {
    evidence.push({
      id: "hr-score",
      title: `HR Score ${score}`,
      description: "Current score from the verified HR Board payload.",
      strength: score >= 80 ? "positive" : "neutral",
    });
  }

  if (isFiniteNumber(edge)) {
    evidence.push({
      id: "projected-edge",
      title: `${edge > 0 ? "+" : ""}${edge}% projected edge`,
      description: "Projected edge supplied by the current player payload.",
      strength:
        edge > 0 ? "positive" : edge < 0 ? "negative" : "neutral",
    });
  }

  if (isFiniteNumber(confidence)) {
    evidence.push({
      id: "confidence",
      title: `${confidence}% confidence`,
      description:
        "Confidence value supplied by the current HR Board payload.",
      strength: confidence >= 75 ? "positive" : "neutral",
    });
  }

  if (pitcherName) {
    evidence.push({
      id: "opposing-pitcher",
      title: `Facing ${pitcherName}`,
      description:
        "Verified opposing pitcher attached to this matchup.",
      strength: "neutral",
    });
  }

  if (opponent) {
    evidence.push({
      id: "opponent",
      title: `Opponent: ${opponent}`,
      description:
        "Opponent supplied by the current production matchup payload.",
      strength: "neutral",
    });
  }

  return evidence;
}
