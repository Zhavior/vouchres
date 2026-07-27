import type { AuroraDecision } from "../AuroraDecision";
import type { AuroraEvidence } from "../AuroraEvidence";
import type { AuroraOutput } from "../AuroraOutput";
import type { DecisionEvent } from "../../trust-ledger/types";

type AuroraCompletedDecision<TInput, TRecommendation> = AuroraDecision<
  TInput,
  TRecommendation
> & {
  state: "completed";
  output: AuroraOutput<TRecommendation>;
};

export type AuroraDecisionRecordContext = {
  marketId: string;
  contractVersion: string;
};

export type DecisionRecordedPayload<TInput, TRecommendation> = {
  decisionType: string;
  marketId: string;
  contractVersion: string;
  question: string;
  input: TInput;
  assumptions: readonly AuroraEvidence[];
  confidence: number;
  score: number;
  recommendation?: TRecommendation;
  modelVersion?: string;
  recordedAt: string;
};

export type AuroraLedgerWritePort = {
  append(event: DecisionEvent): boolean;
};

const isCompletedDecision = <TInput, TRecommendation>(
  decision: AuroraDecision<TInput, TRecommendation>,
): decision is AuroraCompletedDecision<TInput, TRecommendation> =>
  decision.state === "completed" && decision.output !== undefined;

export const toDecisionRecordedEvent = <TInput, TRecommendation>(
  decision: AuroraCompletedDecision<TInput, TRecommendation>,
  context: AuroraDecisionRecordContext,
): DecisionEvent<DecisionRecordedPayload<TInput, TRecommendation>> => ({
  id: `${decision.id}:DECISION_RECORDED:1`,
  streamId: decision.id,
  type: "DECISION_RECORDED",
  version: 1,
  occurredAt: decision.output.generatedAt,
  payload: {
    decisionType: decision.type,
    marketId: context.marketId,
    contractVersion: context.contractVersion,
    question: decision.question,
    input: decision.input,
    assumptions: decision.evidence,
    confidence: decision.output.confidence,
    score: decision.output.score,
    recommendation: decision.output.recommendation,
    modelVersion: decision.output.modelVersion,
    recordedAt: decision.output.generatedAt,
  },
  metadata: {
    source: "aurora",
    correlationId: decision.id,
  },
});

export class AuroraLedgerBridge {
  constructor(private readonly ledger: AuroraLedgerWritePort) {}

  persist<TInput, TRecommendation>(
    decision: AuroraDecision<TInput, TRecommendation>,
    context: AuroraDecisionRecordContext,
  ): readonly DecisionEvent[] {
    if (!isCompletedDecision(decision)) return [];

    const event = toDecisionRecordedEvent(decision, context);
    return this.ledger.append(event) ? [event] : [];
  }
}
