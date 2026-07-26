import type { IntelligenceEvidence } from "../types";

export type RiskSeverity = "low" | "medium" | "high";

export interface IntelligenceRisk {
  severity: RiskSeverity;
  title: string;
  reason: string;
}

export function buildRisks(
  evidence: IntelligenceEvidence[],
): IntelligenceRisk[] {
  const risks: IntelligenceRisk[] = [];

  const negatives = evidence.filter(
    (e) => e.strength === "negative",
  );

  for (const item of negatives) {
    risks.push({
      severity: "medium",
      title: item.title,
      reason: item.description,
    });
  }

  return risks;
}
