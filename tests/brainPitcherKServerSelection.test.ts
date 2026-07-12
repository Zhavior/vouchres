import { describe, expect, it } from "vitest";
import { selectMlbPitcherKFeatures } from "../server/services/intelligence/centralBrain/pitcherKSelectionPolicy";
import type { BrainFeatureSnapshot } from "../server/services/intelligence/centralBrain/featureSchemas";

function snapshot(index: number, overrides: Partial<BrainFeatureSnapshot> = {}): BrainFeatureSnapshot {
  return {
    schemaVersion: "1.0", sport: "mlb", market: "pitcher_strikeouts", eventId: String(index), subjectId: String(index),
    subjectLabel: `Pitcher ${index}`, team: `T${index}`, opponent: `O${index}`,
    observedAt: "2026-07-12T16:50:00.000Z", scheduledAt: "2026-07-12T20:00:00.000Z",
    adapterVersion: "mlb-pitcher-k-features@1", quality: "limited", eligibility: "eligible",
    features: { statTarget: 5, comparator: "gte", seasonKPer9: 9, recentKAverage: 6, gamesStarted: 15 },
    missingFeatures: ["swingingStrikeRate"], reasons: [], risks: [], evidence: [], ...overrides,
  };
}

describe("server pitcher K selection", () => {
  it("selects at most one official probable pitcher per game", () => {
    const input = [snapshot(1), snapshot(2, { eventId: "1", subjectId: "22" }), ...Array.from({ length: 11 }, (_, index) => snapshot(index + 3))];
    const selected = selectMlbPitcherKFeatures(input, new Date("2026-07-12T17:00:00.000Z"));
    expect(selected.length).toBe(12);
    expect(new Set(selected.map((item) => item.snapshot.eventId)).size).toBe(selected.length);
    expect(selected.every((item) => item.snapshot.features.statTarget === 5)).toBe(true);
  });

  it("rejects weak strikeout profiles", () => {
    const selected = selectMlbPitcherKFeatures([snapshot(1, { features: { statTarget: 5, comparator: "gte", seasonKPer9: 5, recentKAverage: 3, gamesStarted: 10 } })], new Date("2026-07-12T17:00:00.000Z"));
    expect(selected).toEqual([]);
  });
});
