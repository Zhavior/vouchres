export type Verdict =
  | "elite"
  | "strong"
  | "good"
  | "neutral"
  | "avoid";

import type { NormalizedPlayerPayload } from "@/adapters/normalized";

export interface VerdictInput {
  payload: NormalizedPlayerPayload;
}

import { buildJudgeScores, type JudgeScore } from "./judgeWeights";

export interface VerdictResult {
  verdict: Verdict;
  score: number;
  confidence: number;
  edge: number;
  positives: string[];
  negatives: string[];
  judges: JudgeScore[];
}

export function verdictEngine(
  input: VerdictInput,
): VerdictResult {
  let score = 0;

  const positives: string[] = [];
  const negatives: string[] = [];

  score += (input.payload.scoreBreakdown?.finalScore ?? 0) * 0.45;
  score += (input.payload.player.vouchScore ?? 0) * 0.35;

  

  

  let verdict: Verdict = "avoid";

  if (score >= 90) verdict = "elite";
  else if (score >= 75) verdict = "strong";
  else if (score >= 60) verdict = "good";
  else if (score >= 45) verdict = "neutral";

  return {
    verdict,
    score: Math.round(score),
    confidence: input.payload.player.vouchScore ?? 0,
    edge: input.payload.scoreBreakdown?.finalScore ?? 0,
    positives,
    negatives,
    judges: buildJudgeScores(),
  };
}
