import { describe, expect, it } from "vitest";
import { buildBrainTemporalContext } from "../server/services/intelligence/centralBrain/temporalPolicy";

describe("ProjectVABrAIns temporal policy", () => {
  const scheduledAt = "2026-07-12T20:00:00.000Z";

  it("opens the decision window only during the final four pregame hours", () => {
    const context = buildBrainTemporalContext({ now: new Date("2026-07-12T17:00:00.000Z"), observedAt: "2026-07-12T16:55:00.000Z", scheduledAt });
    expect(context).toMatchObject({ phase: "lineup_window", canSnapshot: true, lockReason: null });
  });

  it("rejects stale evidence even inside the decision window", () => {
    const context = buildBrainTemporalContext({ now: new Date("2026-07-12T17:30:00.000Z"), observedAt: "2026-07-12T16:00:00.000Z", scheduledAt });
    expect(context.canSnapshot).toBe(false);
    expect(context.lockReason).toBe("Evidence snapshot is stale.");
  });

  it("locks permanently at event start", () => {
    const context = buildBrainTemporalContext({ now: new Date(scheduledAt), observedAt: "2026-07-12T19:59:00.000Z", scheduledAt });
    expect(context).toMatchObject({ phase: "locked", canSnapshot: false });
  });

  it("trusts explicit final status over clock assumptions", () => {
    const context = buildBrainTemporalContext({ now: new Date("2026-07-12T19:00:00.000Z"), observedAt: "2026-07-12T18:59:00.000Z", scheduledAt, gameStatus: "Final" });
    expect(context.phase).toBe("final");
    expect(context.canSnapshot).toBe(false);
  });
});
