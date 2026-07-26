import type { AuroraDecision } from "../AuroraDecision";
import type { AuroraOutput } from "../AuroraOutput";
import type { DecisionEvent } from "../../trust-ledger/types";
import { TrustLedger } from "../../trust-ledger/TrustLedger";

type AuroraCompletedDecision<TInput, TRecommendation> = AuroraDecision<
  TInput,
  TRecommendation
> & {
  state: "completed";
  output: AuroraOutput<TRecommendation>;
};

const createEventId = (
  streamId: string,
  type: DecisionEvent["type"],
  version: number,
): string => `${streamId}:${type}:${version}`;

export const toDecisionCreatedEvent = <TInput, TRecommendation>(
  decision: AuroraDecision<TInput, TRecommendation>,
): DecisionEvent<{
  type: string;
  question: string;
  input: TInput;
  createdAt: string;
}> => ({
  id: createEventId(decision.id, "DecisionCreated", 1),
  streamId: decision.id,
  type: "DecisionCreated",
  version: 1,
  occurredAt: decision.createdAt,
  payload: {
    type: decision.type,
    question: decision.question,
    input: decision.input,
    createdAt: decision.createdAt,
  },
  metadata: {
    source: "aurora",
    correlationId: decision.id,
  },
});

export const toConfidenceRevisedEvent = <TInput, TRecommendation>(
  decision: AuroraCompletedDecision<TInput, TRecommendation>,
  version: number,
): DecisionEvent<{
  confidence: number;
  score: number;
  status: AuroraOutput<TRecommendation>["status"];
  modelVersion?: string;
}> => ({
  id: createEventId(decision.id, "ConfidenceRevised", version),
  streamId: decision.id,
  type: "ConfidenceRevised",
  version,
  occurredAt: decision.output.generatedAt,
  payload: {
    confidence: decision.output.confidence,
    score: decision.output.score,
    status: decision.output.status,
    modelVersion: decision.output.modelVersion,
  },
  metadata: {
    source: "aurora",
    correlationId: decision.id,
    causationId: createEventId(decision.id, "DecisionCreated", 1),
  },
});

const isCompletedDecision = <TInput, TRecommendation>(
  decision: AuroraDecision<TInput, TRecommendation>,
): decision is AuroraCompletedDecision<TInput, TRecommendation> =>
  decision.state === "completed" && decision.output !== undefined;

export class AuroraLedgerBridge {
  constructor(private readonly ledger: TrustLedger) {}

  persist<TInput, TRecommendation>(
    decision: AuroraDecision<TInput, TRecommendation>,
  ): readonly DecisionEvent[] {
    const history = this.ledger.history(decision.id);
    const events: DecisionEvent[] = [];

    if (!history.some((event) => event.type === "DecisionCreated")) {
      const createdEvent = toDecisionCreatedEvent(decision);
      this.ledger.append(createdEvent);
      events.push(createdEvent);
    }

    if (isCompletedDecision(decision)) {
      const existingConfidenceEvents = this.ledger
        .history(decision.id)
        .filter((event) => event.type === "ConfidenceRevised");

      const nextVersion = this.ledger.history(decision.id).length + 1;
      const alreadyPersisted = existingConfidenceEvents.some(
        (event) =>
          event.payload !== null &&
          typeof event.payload === "object" &&
          "confidence" in event.payload &&
          "score" in event.payload &&
          event.payload.confidence === decision.output.confidence &&
          event.payload.score === decision.output.score,
      );

      if (!alreadyPersisted) {
        const confidenceEvent = toConfidenceRevisedEvent(decision, nextVersion);

        this.ledger.append(confidenceEvent);
        events.push(confidenceEvent);
      }
    }

    return events;
  }
}
