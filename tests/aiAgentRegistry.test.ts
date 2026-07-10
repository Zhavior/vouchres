import { describe, expect, it, vi } from "vitest";
import {
  getAgent,
  listAgentMeta,
  listAgents,
  registerAgent,
} from "../server/services/aiJudges/agentRegistry";
import { buildAiJudgeLeaderboard } from "../server/services/aiJudges/aiJudgeLeaderboardService";
import type { JudgeCandidate } from "../server/services/aiJudges/judgeScoring";

vi.mock("../server/middleware/auth", () => ({
  getSupabaseAdmin: vi.fn(async () => ({
    from: () => ({
      select: () => ({
        in: () => ({
          eq: () => ({
            in: async () => ({ data: [], error: null }),
          }),
        }),
      }),
    }),
  })),
}));

vi.mock("../server/hubs/hrBoardHub", () => ({
  getCachedValidatedHrBoard: vi.fn(async () => ({
    payload: {
      date: "2026-07-09",
      candidates: [
        {
          playerId: 1,
          playerName: "Test Hitter",
          team: "NYY",
          opponent: "BOS",
          hrScore: 72,
          confidenceTier: "strong",
          lineupStatus: "confirmed",
          activeRosterStatus: true,
          scoreBreakdown: {
            hitterPower: 80,
            pitcherVulnerability: 70,
            parkContext: 65,
            lineupVolume: 75,
            handednessEdge: 60,
            recentForm: 68,
            penalties: 5,
          },
        } satisfies JudgeCandidate,
      ],
    },
  })),
}));

describe("ai judge agent registry", () => {
  it("lists four built-in judge agents", () => {
    const agents = listAgentMeta();
    expect(agents).toHaveLength(4);
    expect(agents.every((a) => a.builtin)).toBe(true);
    expect(agents.map((a) => a.code).sort()).toEqual(["DS", "MR", "PH", "RA"]);
  });

  it("exposes scoreCandidate, buildSinglePick, and gradeStrategy on built-ins", () => {
    const scout = getAgent("data_scout");
    expect(scout).toBeDefined();
    expect(typeof scout?.scoreCandidate).toBe("function");
    expect(typeof scout?.buildSinglePick).toBe("function");
    expect(typeof scout?.buildPicks).toBe("function");
    expect(scout?.gradeStrategy).toBeUndefined();

    const auditor = getAgent("risk_auditor");
    expect(auditor?.gradeStrategy?.isAvoidPick).toBe(true);
  });

  it("rejects overwriting built-in agents", () => {
    const scout = getAgent("data_scout")!;
    expect(() =>
      registerAgent({
        ...scout,
        displayName: "Fake Scout",
      }),
    ).toThrow(/built-in/i);
  });
});

describe("leaderboard via registry", () => {
  it("builds leaderboard with four judges from registry", async () => {
    const board = await buildAiJudgeLeaderboard();
    expect(board.leaderboard).toHaveLength(4);
    expect(board.leaderboard.every((j) => j.topPicks.length <= 1)).toBe(true);
    expect(listAgents().map((a) => a.id).sort()).toEqual(
      board.leaderboard.map((j) => j.id).sort(),
    );
  });
});
