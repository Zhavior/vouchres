export type DecisionEventType =
  | "DecisionCreated"
  | "ConfidenceRevised"
  | "OutcomeResolved"
  | "DecisionVoided"
  | "DecisionUnresolved";

export interface DecisionEvent<T = unknown> {
  id: string;
  streamId: string;
  type: DecisionEventType;
  version: number;
  occurredAt: string;
  payload: T;
  metadata: {
    source: "aurora" | "resolution-engine";
    correlationId?: string;
    causationId?: string;
  };
}
