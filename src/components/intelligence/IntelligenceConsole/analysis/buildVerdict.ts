import type { IntelligenceTier } from "../types";

export interface IntelligenceVerdict {
  grade: string;
  badge: string;
  summary: string;
  recommendation: "Target" | "Watch" | "Pass";
}

export interface BuildVerdictInput {
  score: number;
  confidence: number;
  tier: IntelligenceTier;
}

export function buildVerdict({
  score,
  confidence,
  tier,
}: BuildVerdictInput): IntelligenceVerdict {
  if (score >= 85 && confidence >= 80) {
    return {
      grade: "Elite",
      badge: "★★★★★",
      summary: "Strong underlying indicators support this matchup.",
      recommendation: "Target",
    };
  }

  if (score >= 70) {
    return {
      grade: "Strong",
      badge: "★★★★",
      summary: "Positive profile with some uncertainty remaining.",
      recommendation: "Watch",
    };
  }

  return {
    grade: tier,
    badge: "★★★",
    summary: "Current data does not indicate a premium opportunity.",
    recommendation: "Pass",
  };
}
