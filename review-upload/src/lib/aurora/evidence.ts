import type { AuroraEvidence } from "./types";

export function createEvidence(
  title: string,
  description: string,
  weight: number,
): AuroraEvidence {
  return {
    id: crypto.randomUUID(),
    title,
    description,
    weight,
  };
}

export function totalEvidenceWeight(
  evidence: AuroraEvidence[],
): number {
  return evidence.reduce((sum, item) => sum + item.weight, 0);
}
