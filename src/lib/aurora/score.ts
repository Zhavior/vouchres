import type { AuroraEvidence, AuroraRisk } from "./types";

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

export function calculateAuroraScore(
  evidence: AuroraEvidence[],
  risks: AuroraRisk[],
): number {
  const evidenceScore = evidence.reduce(
    (sum, item) => sum + item.weight,
    0,
  );

  const riskPenalty = risks.reduce((sum, risk) => {
    switch (risk.severity) {
      case "high":
        return sum + 15;
      case "medium":
        return sum + 8;
      default:
        return sum + 3;
    }
  }, 0);

  return clamp(Math.round(evidenceScore - riskPenalty));
}
