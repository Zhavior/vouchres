import type { DecisionEvent } from "./types";

export class EventStore {
  private readonly events: DecisionEvent[] = [];

  append(event: DecisionEvent): void {
    this.events.push(Object.freeze(event));
  }

  stream(streamId: string): readonly DecisionEvent[] {
    return this.events.filter(e => e.streamId === streamId);
  }

  all(): readonly DecisionEvent[] {
    return this.events;
  }
}
