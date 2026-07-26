import type { DecisionEvent } from "./types";
import { replay } from "./DecisionAggregate";

export interface DecisionProjection {
  streamId: string;
  version: number;
  latestEvent: DecisionEvent;
  state: NonNullable<ReturnType<typeof replay>>;
}

export class ProjectionStore {
  private readonly projections = new Map<string, DecisionProjection>();

  rebuild(events: readonly DecisionEvent[]): void {
    const latestEvent = events.at(-1);
    const state = replay(events);

    if (!latestEvent || !state) return;

    this.projections.set(latestEvent.streamId, {
      streamId: latestEvent.streamId,
      version: latestEvent.version,
      latestEvent,
      state,
    });
  }

  get(streamId: string) {
    return this.projections.get(streamId);
  }
}
