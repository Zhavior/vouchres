import type { DecisionEvent } from "./types";

export interface DecisionState {
  streamId: string;
  version: number;
  status:
    | "LIVE"
    | "PENDING_RESOLUTION"
    | "RESOLVED"
    | "VOID"
    | "UNRESOLVED";
  confidence?: number;
  outcome?: "WIN" | "LOSS" | "VOID";
}

export function replay(events: readonly DecisionEvent[]): DecisionState | null {
  if (events.length === 0) return null;

  const state: DecisionState = {
    streamId: events[0].streamId,
    version: 0,
    status: "LIVE",
  };

  for (const event of events) {
    state.version = event.version;

    switch (event.type) {
      case "DecisionCreated":
        state.status = "LIVE";
        state.confidence = (event.payload as any).confidence;
        break;

      case "ConfidenceRevised":
        state.confidence = (event.payload as any).confidence;
        break;

      case "OutcomeResolved":
        state.status = "RESOLVED";
        state.outcome = (event.payload as any).result;
        break;

      case "DecisionVoided":
        state.status = "VOID";
        break;

      case "DecisionUnresolved":
        state.status = "UNRESOLVED";
        break;
    }
  }

  return state;
}
