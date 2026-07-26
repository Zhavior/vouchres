import type { DecisionEvent } from "./types";
import { replay } from "./DecisionAggregate";

export interface DecisionProjection {
  streamId: string;
  version: number;
  latestEvent: DecisionEvent;
}

export class ProjectionStore {
  private readonly projections = new Map<string, DecisionProjection>();

  apply(event: DecisionEvent): void {
    const projection = this.projections.get(event.streamId);

    const history = projection
      ? [...(projection.latestEvent ? [projection.latestEvent] : []), event]
      : [event];

    replay(history);

    this.projections.set(event.streamId, {
      streamId: event.streamId,
      version: event.version,
      latestEvent: event,
    });
  }

  get(streamId: string) {
    return this.projections.get(streamId);
  }
}
