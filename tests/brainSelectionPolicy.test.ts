import { describe, expect, it } from "vitest";
import type { BrainFeatureSnapshot } from "../server/services/intelligence/centralBrain/featureSchemas";
import { selectMlbHrFeatures } from "../server/services/intelligence/centralBrain/selectionPolicy";

function snapshot(overrides: Partial<BrainFeatureSnapshot> = {}): BrainFeatureSnapshot {
  return {
    schemaVersion: "1.0",
    sport: "mlb",
    market: "home_run",
    eventId: "game-1",
    subjectId: "player-1",
    subjectLabel: "Player One",
    team: "NYY",
    opponent: "BOS",
    observedAt: "2026-07-12T16:55:00.000Z",
    scheduledAt: "2026-07-12T20:00:00.000Z",
    adapterVersion: "test@1",
    quality: "full",
    eligibility: "eligible",
    features: {
      rawHrScore: 85,
      hitterPower: 85,
      pitcherVulnerability: 75,
      recentForm: 70,
      dataConfidence: 90,
      riskTier: "Strong",
    },
    missingFeatures: [],
    reasons: ["Verified"],
    risks: [],
    evidence: [],
    ...overrides,
  };
}

describe("ProjectVABrAIns selection policy", () => {
  it("selects only pregame observations", () => {
    const result = selectMlbHrFeatures([snapshot()], new Date("2026-07-12T17:00:00.000Z"));
    expect(result).toHaveLength(1);
  });

  it("rejects observations captured after scheduled start", () => {
    const result = selectMlbHrFeatures([
      snapshot({ observedAt: "2026-07-12T20:01:00.000Z" }),
    ], new Date("2026-07-12T19:00:00.000Z"));
    expect(result).toHaveLength(0);
  });

  it("rejects a decision when the game has already started", () => {
    const result = selectMlbHrFeatures([snapshot()], new Date("2026-07-12T20:01:00.000Z"));
    expect(result).toHaveLength(0);
  });

  it("rejects freeze-mode picks outside the 4h window", () => {
    const result = selectMlbHrFeatures(
      [snapshot({ scheduledAt: "2026-07-12T22:00:00.000Z", observedAt: "2026-07-12T11:55:00.000Z" })],
      new Date("2026-07-12T12:00:00.000Z"),
      { mode: "decision" },
    );
    expect(result).toHaveLength(0);
  });

  it("ranks a monitoring slate in the 4–12h band without freeze eligibility", () => {
    const result = selectMlbHrFeatures(
      [snapshot({ scheduledAt: "2026-07-12T22:00:00.000Z", observedAt: "2026-07-12T11:55:00.000Z" })],
      new Date("2026-07-12T12:00:00.000Z"),
      { mode: "monitoring" },
    );
    expect(result).toHaveLength(1);
  });

  it("still rejects monitoring picks after first pitch", () => {
    const result = selectMlbHrFeatures(
      [snapshot()],
      new Date("2026-07-12T20:01:00.000Z"),
      { mode: "monitoring" },
    );
    expect(result).toHaveLength(0);
  });

  it("enforces team and game concentration limits", () => {
    const candidates = Array.from({ length: 5 }, (_, index) => snapshot({
      subjectId: `player-${index}`,
      subjectLabel: `Player ${index}`,
      eventId: index < 3 ? "game-1" : `game-${index}`,
      team: index < 3 ? "NYY" : `T${index}`,
    }));
    const result = selectMlbHrFeatures(candidates, new Date("2026-07-12T17:00:00.000Z"));
    expect(result.filter((item) => item.snapshot.eventId === "game-1")).toHaveLength(2);
    expect(result.filter((item) => item.snapshot.team === "NYY")).toHaveLength(2);
  });

  it("targets at least ten picks across distinct teams when the slate supports it", () => {
    const candidates = Array.from({ length: 12 }, (_, index) => snapshot({
      subjectId: `player-${index}`, subjectLabel: `Player ${index}`, eventId: `game-${index}`,
      team: `T${index}`, opponent: `O${index}`,
    }));
    const result = selectMlbHrFeatures(candidates, new Date("2026-07-12T17:00:00.000Z"));
    expect(result.length).toBeGreaterThanOrEqual(10);
    expect(new Set(result.slice(0, 10).map((item) => item.snapshot.team)).size).toBe(10);
  });
});
