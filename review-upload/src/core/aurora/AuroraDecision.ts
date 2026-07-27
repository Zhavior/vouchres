import {
  createAuroraEvidence,
  getEvidenceContribution,
  type AuroraEvidence,
  type AuroraEvidenceInput,
} from "./AuroraEvidence";
import type {
  AuroraOutput,
  AuroraOutputStatus,
  AuroraReason,
  AuroraRisk,
} from "./AuroraOutput";

export type AuroraDecisionState =
  "draft" | "evaluating" | "completed" | "superseded";

export type AuroraDecision<TInput = unknown, TRecommendation = unknown> = {
  id: string;
  type: string;
  question: string;
  state: AuroraDecisionState;
  input: TInput;
  evidence: readonly AuroraEvidence[];
  output?: AuroraOutput<TRecommendation>;
  createdAt: string;
  updatedAt: string;
};

export type AuroraEvaluationOptions<TRecommendation> = {
  recommendation?: TRecommendation;
  headline?: string;
  explanation?: string;
  reasons?: readonly AuroraReason[];
  risks?: readonly AuroraRisk[];
  score?: number;
  modelVersion?: string;
  metadata?: Readonly<Record<string, unknown>>;
};

const now = (): string => new Date().toISOString();

const clamp01 = (value: number): number =>
  Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

export const createAuroraDecision = <TInput, TRecommendation = unknown>(input: {
  id: string;
  type: string;
  question: string;
  input: TInput;
}): AuroraDecision<TInput, TRecommendation> => {
  const timestamp = now();

  return {
    ...input,
    state: "draft",
    evidence: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

export const addAuroraEvidence = <TInput, TRecommendation>(
  decision: AuroraDecision<TInput, TRecommendation>,
  input: AuroraEvidenceInput,
): AuroraDecision<TInput, TRecommendation> => {
  const evidence = createAuroraEvidence({
    ...input,
    decisionId: decision.id,
  });

  return {
    ...decision,
    state: "evaluating",
    evidence: [
      ...decision.evidence.filter((item) => item.id !== evidence.id),
      evidence,
    ],
    updatedAt: now(),
  };
};

export const evaluateAuroraDecision = <TInput, TRecommendation>(
  decision: AuroraDecision<TInput, TRecommendation>,
  options: AuroraEvaluationOptions<TRecommendation> = {},
): AuroraDecision<TInput, TRecommendation> => {
  const evidenceCount = decision.evidence.length;

  const score =
    options.score ??
    (evidenceCount === 0
      ? 0
      : decision.evidence.reduce(
          (total, evidence) => total + getEvidenceContribution(evidence),
          0,
        ) / evidenceCount);

  const confidence =
    evidenceCount === 0
      ? 0
      : clamp01(
          decision.evidence.reduce(
            (total, evidence) => total + evidence.confidence,
            0,
          ) / evidenceCount,
        );

  let status: AuroraOutputStatus = "insufficient-evidence";

  if (evidenceCount > 0 && confidence >= 0.5) {
    status =
      score >= 0.25 ? "recommended" : score <= -0.25 ? "rejected" : "caution";
  }

  const generatedAt = now();

  return {
    ...decision,
    state: "completed",
    output: {
      decisionId: decision.id,
      status,
      recommendation: options.recommendation,
      confidence,
      score,
      headline: options.headline ?? decision.question,
      explanation:
        options.explanation ??
        `Aurora evaluated ${evidenceCount} evidence item${
          evidenceCount === 1 ? "" : "s"
        }.`,
      reasons: options.reasons ?? [],
      risks: options.risks ?? [],
      generatedAt,
      modelVersion: options.modelVersion,
      metadata: options.metadata,
    },
    updatedAt: generatedAt,
  };
};
