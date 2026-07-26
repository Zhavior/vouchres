import type { DecisionEvent } from "./types";
import type { DecisionOutcome } from "./types";

export interface DecisionState {
  streamId: string;
  version: number;
  status: "LIVE" | "PENDING_RESOLUTION" | "RESOLVED" | "VOID" | "UNRESOLVED";
  confidence?: number;
  outcome?: DecisionOutcome;
  contractVersion?: string;
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
      case "DECISION_RECORDED":
        state.status = "LIVE";
        state.confidence = (event.payload as any).confidence;
        break;

      case "OUTCOME_CERTIFIED": {
        const outcome = (event.payload as any).outcome as DecisionOutcome;
        state.outcome = outcome;
        state.status =
          outcome === "VOID"
            ? "VOID"
            : outcome === "UNRESOLVED"
              ? "UNRESOLVED"
              : "RESOLVED";
        break;
      }

      case "CORRECTION_CERTIFIED":
        state.outcome = (event.payload as any).outcome;
        break;

      case "CONTRACT_VERSION_APPLIED":
        state.contractVersion = (event.payload as any).contractVersion;
        break;
    }
  }

  return state;
}
