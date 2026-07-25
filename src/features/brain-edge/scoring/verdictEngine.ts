import type { NormalizedPlayerPayload } from "@/adapters/normalized";

import { runJudges } from "./judges";
import { aggregateJudges } from "./aggregateJudges";
import { buildVerdict } from "./buildVerdict";
import type { JudgeResult } from "./judges/types";

export type Verdict =
  | "elite"
  | "strong"
  | "good"
  | "neutral"
  | "avoid";

export interface VerdictInput {
  payload: NormalizedPlayerPayload;
}

export interface VerdictResult {
  verdict: Verdict;
  score: number;
  confidence: number;
  edge: number;
  positives: string[];
  negatives: string[];
  judges: JudgeResult[];
}

export function verdictEngine(
  input: VerdictInput,
): VerdictResult {
  const judges = runJudges(input.payload);

  const aggregate = aggregateJudges(judges);

  return {
    verdict: buildVerdict(aggregate),

    score: aggregate.overallScore,

    confidence: aggregate.confidence,

    edge: input.payload.scoreBreakdown?.finalScore ?? 0,

    positives: aggregate.strengths,

    negatives: aggregate.weaknesses,

    judges,
  };
}
