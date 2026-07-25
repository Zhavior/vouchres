import type { JudgeResult } from "./judges/types";

const WEIGHTS: Record<JudgeResult["id"], number> = {
  barrel: 0.30,
  matchup: 0.25,
  park: 0.15,
  weather: 0.10,
  form: 0.10,
  lineup: 0.10,
};

export interface AggregateJudgeResult {
  overallScore: number;
  confidence: number;
  strengths: string[];
  weaknesses: string[];
}

export function aggregateJudges(
  judges: JudgeResult[],
): AggregateJudgeResult {
  let weightedScore = 0;
  let totalWeight = 0;
  let confidence = 0;

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  for (const judge of judges) {
    const weight = WEIGHTS[judge.id] ?? 0;

    weightedScore += judge.score * weight;
    confidence += judge.confidence * weight;
    totalWeight += weight;

    if (judge.score >= 75) strengths.push(judge.title);
    if (judge.score <= 45) weaknesses.push(judge.title);
  }

  return {
    overallScore: Math.round(
      totalWeight ? weightedScore / totalWeight : 0,
    ),
    confidence: Math.round(
      totalWeight ? confidence / totalWeight : 0,
    ),
    strengths,
    weaknesses,
  };
}
