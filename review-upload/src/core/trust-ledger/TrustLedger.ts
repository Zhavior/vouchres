import { EventStore } from "./EventStore";
import { ProjectionStore } from "./ProjectionStore";
import type { DecisionEvent } from "./types";

export class TrustLedger {
  constructor(
    private readonly events = new EventStore(),
    private readonly projections = new ProjectionStore(),
  ) {}

  append(event: DecisionEvent): boolean {
    const appended = this.events.append(event);

    if (appended) {
      this.projections.rebuild(this.events.stream(event.streamId));
    }

    return appended;
  }

  history(streamId: string) {
    return this.events.stream(streamId);
  }

  current(streamId: string) {
    return this.projections.get(streamId);
  }
}
