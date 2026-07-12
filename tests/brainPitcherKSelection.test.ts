import { describe, expect, it } from "vitest";
import { selectPitcherKBrainPicks } from "../src/features/brain/pitcherKSelection";

describe("pitcher K Brain selection", () => {
  it("targets ten pitchers across teams when the slate supports it", () => {
    const rows = Array.from({ length: 12 }, (_, index) => ({
      stableId: `pitcher-${index}`, playerName: `Pitcher ${index}`, playerId: index + 1,
      team: `T${index}`, opponent: `O${index}`, lineupStatus: "confirmed" as const,
      statScore: 72 - index / 10, confidence: 70, tier: "strong" as const,
      drivers: [{ id: "k-rate", label: "Strikeout rate", value: 75, weight: 50 }],
      isHeuristic: true, statType: "pitcher_k" as const,
    })) as any;
    const selected = selectPitcherKBrainPicks(rows);
    expect(selected.length).toBeGreaterThanOrEqual(10);
    expect(new Set(selected.slice(0, 10).map((item) => item.pitcher.team)).size).toBe(10);
  });
});
