import { describe, expect, it, vi } from "vitest";
import type { CentralBrainAdapter, CentralBrainSnapshot } from "../server/services/intelligence/centralBrain/contracts";
import { CentralBrainAgent, listCentralBrainSports } from "../server/services/intelligence/centralBrain/centralBrainService";

describe("CentralBrainAgent", () => {
  it("reports unsupported sports honestly", () => {
    expect(listCentralBrainSports()).toEqual([
      { sport: "mlb", available: true, engineVersion: "mlb-daily-report@1" },
      { sport: "nba", available: false, engineVersion: null },
      { sport: "nfl", available: false, engineVersion: null },
    ]);
  });

  it("preserves deterministic adapter output and marks narration explanation-only", async () => {
    const adapter: CentralBrainAdapter = {
      sport: "mlb",
      engineVersion: "test-engine@1",
      async build() {
        return {
          scope: "daily:test",
          generatedAt: new Date(0).toISOString(),
          dataQuality: "full",
          decisions: [{
            id: "decision-1",
            subjectId: "player-1",
            subjectLabel: "Test Player",
            market: "home_run",
            score: 73,
            confidence: 68,
            rank: 1,
            recommendation: "Playable",
            reasons: ["Verified input"],
            risks: [],
            evidence: [],
            metadata: {},
          }],
          warnings: [],
          disclaimer: "test only",
        };
      },
    };
    const narrator = vi.fn(async (snapshot: Readonly<CentralBrainSnapshot>) => `Score remains ${snapshot.decisions[0].score}.`);
    const agent = new CentralBrainAgent(narrator, new Map([["mlb", adapter]]));

    const result = await agent.run("mlb", {});

    expect(result.decisions[0].score).toBe(73);
    expect(result.agent).toEqual({
      id: "vouchedge-central-brain",
      role: "explanation_only",
      summary: "Score remains 73.",
    });
    expect(narrator).toHaveBeenCalledOnce();
  });
});

// Compile-time contract guard: adapters cannot omit trust metadata.
const _contractGuard: CentralBrainAdapter = {
  sport: "mlb",
  engineVersion: "test",
  async build() {
    return {
      scope: "test",
      generatedAt: new Date(0).toISOString(),
      dataQuality: "limited",
      decisions: [],
      warnings: [],
      disclaimer: "test only",
    };
  },
};

void _contractGuard;
