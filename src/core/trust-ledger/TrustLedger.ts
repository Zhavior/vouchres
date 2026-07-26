import { EventStore } from "./EventStore";
import { ProjectionStore } from "./ProjectionStore";
import type { DecisionEvent } from "./types";

export class TrustLedger {
  constructor(
    private readonly events = new EventStore(),
    private readonly projections = new ProjectionStore(),
  ) {}

  append(event: DecisionEvent) {
    this.events.append(event);
    this.projections.apply(event);
  }

  history(streamId: string) {
    return this.events.stream(streamId);
  }

  current(streamId: string) {
    return this.projections.get(streamId);
  }
}
