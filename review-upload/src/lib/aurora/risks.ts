import type { AuroraRisk } from "./types";

export function createRisk(
  title: string,
  description: string,
  severity: AuroraRisk["severity"],
): AuroraRisk {
  return {
    id: crypto.randomUUID(),
    title,
    description,
    severity,
  };
}

export function totalRiskPenalty(
  risks: AuroraRisk[],
): number {
  return risks.reduce((sum, risk) => {
    switch (risk.severity) {
      case "high":
        return sum + 15;
      case "medium":
        return sum + 8;
      case "low":
      default:
        return sum + 3;
    }
  }, 0);
}
