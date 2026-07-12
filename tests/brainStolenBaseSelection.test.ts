import { describe, expect, it } from "vitest";
import type { BrainFeatureSnapshot } from "../server/services/intelligence/centralBrain/featureSchemas";
import { selectMlbStolenBaseFeatures } from "../server/services/intelligence/centralBrain/stolenBaseSelectionPolicy";

function runner(overrides: Partial<BrainFeatureSnapshot> = {}): BrainFeatureSnapshot {
  return {
    schemaVersion: "1.0", sport: "mlb", market: "stolen_base", eventId: "game-1", subjectId: "runner-1",
    subjectLabel: "Runner One", team: "NYY", opponent: "BOS", observedAt: "2026-07-12T16:55:00.000Z",
    scheduledAt: "2026-07-12T20:00:00.000Z", adapterVersion: "sb@1", quality: "limited", eligibility: "eligible",
    features: { attemptsPerGame: 0.35, stealSuccessRate: 0.85, recentAttempts: 2, onBasePercentage: 0.36, seasonStolenBases: 12 },
    missingFeatures: ["sprintSpeed"], reasons: [], risks: [], evidence: [], ...overrides,
  };
}

describe("stolen base selection policy", () => {
  it("selects an active runner independently from HR scoring", () => {
    const selected = selectMlbStolenBaseFeatures([runner()], new Date("2026-07-12T17:00:00.000Z"));
    expect(selected).toHaveLength(1);
    expect(selected[0].snapshot.market).toBe("stolen_base");
  });

  it("rejects inactive runners and late observations", () => {
    expect(selectMlbStolenBaseFeatures([runner({ features: { seasonStolenBases: 1 } })], new Date("2026-07-12T17:00:00.000Z"))).toHaveLength(0);
    expect(selectMlbStolenBaseFeatures([runner()], new Date("2026-07-12T20:01:00.000Z"))).toHaveLength(0);
  });

  it("targets at least ten runners from distinct teams when evidence supports it", () => {
    const candidates = Array.from({ length: 12 }, (_, index) => runner({
      subjectId: `runner-${index}`, subjectLabel: `Runner ${index}`, eventId: `game-${index}`,
      team: `T${index}`, opponent: `O${index}`,
    }));
    const selected = selectMlbStolenBaseFeatures(candidates, new Date("2026-07-12T17:00:00.000Z"));
    expect(selected.length).toBeGreaterThanOrEqual(10);
    expect(new Set(selected.slice(0, 10).map((item) => item.snapshot.team)).size).toBe(10);
  });
});
