import type { JudgeResult } from "./judges/types";

export interface AggregateVerdict {
  overallScore: number;
  confidence: number;
  strengths: JudgeResult[];
  weaknesses: JudgeResult[];
}

export function aggregateJudges(
  judges: JudgeResult[]
): AggregateVerdict {
  if (!judges.length) {
    return {
      overallScore: 0,
      confidence: 0,
      strengths: [],
      weaknesses: [],
    };
  }

  const overallScore = Math.round(
    judges.reduce((sum, j) => sum + j.score, 0) /
      judges.length
  );

  const confidence = Math.round(
    judges.reduce((sum, j) => sum + j.confidence, 0) /
      judges.length
  );

  const strengths = [...judges]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const weaknesses = [...judges]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return {
    overallScore,
    confidence,
    strengths,
    weaknesses,
  };
}
