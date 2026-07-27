import {
  addAuroraEvidence,
  createAuroraDecision,
  evaluateAuroraDecision,
  type AuroraDecision,
} from "../AuroraDecision";
import type { AuroraEvidenceInput } from "../AuroraEvidence";
import type { AuroraReason, AuroraRisk } from "../AuroraOutput";

export type MlbHrDecisionInput = {
  playerId: string;
  playerName: string;
  team?: string;
  opponent?: string;
  pitcherId?: string;
  pitcherName?: string;
  gameId?: string;
  gameDate: string;
};

export type MlbHrRecommendation = {
  playerId: string;
  playerName: string;
  market: "home-run";
  selection: "yes";
  projectedProbability?: number;
  impliedProbability?: number;
  edge?: number;
};

export type MlbHrDecision = AuroraDecision<
  MlbHrDecisionInput,
  MlbHrRecommendation
>;

export type MlbHrEvaluationInput = {
  decision: MlbHrDecision;
  evidence: readonly AuroraEvidenceInput[];
  recommendation: MlbHrRecommendation;
  reasons?: readonly AuroraReason[];
  risks?: readonly AuroraRisk[];
  modelVersion?: string;
};

export const createMlbHrDecision = (input: MlbHrDecisionInput): MlbHrDecision =>
  createAuroraDecision<MlbHrDecisionInput, MlbHrRecommendation>({
    id: `mlb-hr:${input.gameDate}:${input.gameId ?? "unknown"}:${input.playerId}`,
    type: "mlb.home-run",
    question: `Will ${input.playerName} hit a home run?`,
    input,
  });

export const evaluateMlbHrDecision = (
  input: MlbHrEvaluationInput,
): MlbHrDecision => {
  const withEvidence = input.evidence.reduce<MlbHrDecision>(
    (decision, evidence) =>
      addAuroraEvidence(decision, {
        ...evidence,
        decisionId: decision.id,
      }),
    input.decision,
  );

  const projectedProbability = input.recommendation.projectedProbability ?? 0;

  const impliedProbability = input.recommendation.impliedProbability ?? 0;

  const edge =
    input.recommendation.edge ??
    (projectedProbability > 0 && impliedProbability > 0
      ? projectedProbability - impliedProbability
      : undefined);

  return evaluateAuroraDecision(withEvidence, {
    recommendation: {
      ...input.recommendation,
      edge,
    },
    headline: `${input.recommendation.playerName} home-run decision`,
    explanation:
      edge === undefined
        ? "Aurora evaluated the available home-run evidence."
        : `Aurora identified a ${(edge * 100).toFixed(1)} percentage-point probability edge.`,
    reasons: input.reasons,
    risks: input.risks,
    modelVersion: input.modelVersion,
    metadata: {
      market: "home-run",
      projectedProbability,
      impliedProbability,
      edge,
    },
  });
};
