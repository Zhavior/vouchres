import { describe, expect, it } from "vitest";
import { BrainFeatureSnapshotSchema } from "../server/services/intelligence/centralBrain/featureSchemas";

describe("Brain feature snapshot contract", () => {
  it("supports future sport adapters through one versioned contract", () => {
    for (const sport of ["mlb", "nba", "nfl", "nhl"] as const) {
      const result = BrainFeatureSnapshotSchema.safeParse({
        schemaVersion: "1.0",
        sport,
        market: "test_market",
        eventId: "event-1",
        subjectId: "subject-1",
        subjectLabel: "Subject",
        team: "TEAM",
        opponent: "OPP",
        observedAt: "2026-07-12T16:00:00.000Z",
        scheduledAt: "2026-07-12T20:00:00.000Z",
        adapterVersion: `${sport}-test@1`,
        quality: "partial",
        eligibility: "preview",
        features: { metric: 42, known: true, unavailable: null },
        missingFeatures: ["weather"],
        reasons: [],
        risks: [],
        evidence: [],
      });
      expect(result.success, sport).toBe(true);
    }
  });

  it("rejects unversioned or untraceable snapshots", () => {
    const result = BrainFeatureSnapshotSchema.safeParse({ sport: "mlb", features: {} });
    expect(result.success).toBe(false);
  });
});
