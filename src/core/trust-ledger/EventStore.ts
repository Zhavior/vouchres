import type { DecisionEvent } from "./types";

export class EventStore {
  private readonly events: DecisionEvent[] = [];

  append(event: DecisionEvent): boolean {
    const existing = this.events.find((item) => item.id === event.id);

    if (existing) {
      if (JSON.stringify(existing) !== JSON.stringify(event)) {
        throw new Error(`immutable_event_conflict:${event.id}`);
      }

      return false;
    }

    const streamVersion = this.events.filter(
      (item) => item.streamId === event.streamId,
    ).length;

    if (event.version !== streamVersion + 1) {
      throw new Error(
        `invalid_event_version:${event.streamId}:expected=${streamVersion + 1}:received=${event.version}`,
      );
    }

    this.events.push(Object.freeze(event));
    return true;
  }

  stream(streamId: string): readonly DecisionEvent[] {
    return this.events.filter((e) => e.streamId === streamId);
  }

  all(): readonly DecisionEvent[] {
    return this.events;
  }
}
