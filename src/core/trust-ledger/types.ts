export type DecisionEventType =
  | "DECISION_RECORDED"
  | "OUTCOME_CERTIFIED"
  | "CORRECTION_CERTIFIED"
  | "CONTRACT_VERSION_APPLIED";

export type DecisionOutcome = "WIN" | "LOSS" | "VOID" | "PUSH" | "UNRESOLVED";

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
