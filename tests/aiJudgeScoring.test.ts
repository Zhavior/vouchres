import { describe, expect, it } from "vitest";
import {
  agentScore,
  buildJudgeReason,
  computeJudgeWinRate,
  judgePickMeta,
  normalizeMetrics,
  rankCandidatesForJudge,
  selectTopPicksForJudge,
  singlePickLimit,
  type JudgeCandidate,
  type JudgeId,
} from "../server/services/aiJudges/judgeScoring";

function makeCandidate(overrides: Partial<JudgeCandidate> & { name: string }): JudgeCandidate {
  return {
    playerId: overrides.name.length,
    playerName: overrides.name,
    team: "NYY",
    opponent: "BOS",
    opponentPitcherName: "Test Pitcher",
    venue: "Yankee Stadium",
    hrScore: 65,
    confidenceTier: "strong",
    lineupStatus: "confirmed",
    activeRosterStatus: true,
    reasons: ["Test reason"],
    warnings: [],
    scoreBreakdown: {
      hitterPower: 60,
      pitcherVulnerability: 60,
      parkContext: 55,
      lineupVolume: 70,
      handednessEdge: 65,
      recentForm: 55,
      penalties: 10,
    },
    ...overrides,
  };
}

const FIXTURES: JudgeCandidate[] = [
  makeCandidate({
    name: "Clean Math Guy",
    hrScore: 68,
    confidenceTier: "elite",
    lineupStatus: "confirmed",
    warnings: [],
    scoreBreakdown: {
      hitterPower: 58,
      pitcherVulnerability: 55,
      parkContext: 52,
      lineupVolume: 88,
      handednessEdge: 78,
      recentForm: 50,
      penalties: 6,
    },
  }),
  makeCandidate({
    name: "Power Slugger",
    hrScore: 72,
    scoreBreakdown: {
      hitterPower: 92,
      pitcherVulnerability: 85,
      parkContext: 78,
      lineupVolume: 65,
      handednessEdge: 55,
      recentForm: 48,
      penalties: 12,
    },
  }),
  makeCandidate({
    name: "Hot Streak",
    hrScore: 66,
    scoreBreakdown: {
      hitterPower: 55,
      pitcherVulnerability: 52,
      parkContext: 58,
      lineupVolume: 82,
      handednessEdge: 60,
      recentForm: 91,
      penalties: 8,
    },
  }),
  makeCandidate({
    name: "Trap Profile",
    hrScore: 48,
    confidenceTier: "thin",
    lineupStatus: "projected_unconfirmed",
    warnings: ["Official lineup not posted yet.", "Small sample power penalty."],
    scoreBreakdown: {
      hitterPower: 42,
      pitcherVulnerability: 40,
      parkContext: 48,
      lineupVolume: 55,
      handednessEdge: 45,
      recentForm: 38,
      penalties: 28,
    },
  }),
  makeCandidate({
    name: "Balanced Star",
    hrScore: 78,
    confidenceTier: "elite",
    scoreBreakdown: {
      hitterPower: 76,
      pitcherVulnerability: 74,
      parkContext: 72,
      lineupVolume: 80,
      handednessEdge: 70,
      recentForm: 73,
      penalties: 9,
    },
  }),
];

describe("normalizeMetrics", () => {
  it("maps v2 scoreBreakdown aliases to judge metrics", () => {
    const metrics = normalizeMetrics(
      makeCandidate({
        name: "Alias Test",
        scoreBreakdown: {
          hitterPower: 70,
          pitcherVulnerability: 65,
          parkFactor: 112,
          lineupConfidence: 84,
          recentForm: 60,
          riskPenalty: 11,
        },
      }),
    );

    expect(metrics.parkContext).toBeGreaterThan(50);
    expect(metrics.lineupVolume).toBe(84);
    expect(metrics.penalties).toBe(11);
  });
});

describe("agentScore per persona", () => {
  it("ranks different top candidates per judge", () => {
    const topByJudge = Object.fromEntries(
      (["data_scout", "power_hunter", "momentum_reader", "risk_auditor", "pro_edge_agent"] as JudgeId[]).map(
        (judgeId) => [judgeId, rankCandidatesForJudge(judgeId, FIXTURES, 1)[0]?.playerName],
      ),
    );

    expect(topByJudge.data_scout).toBe("Clean Math Guy");
    expect(topByJudge.power_hunter).toBe("Power Slugger");
    expect(topByJudge.momentum_reader).toBe("Hot Streak");
    expect(topByJudge.risk_auditor).toBe("Trap Profile");
    expect(topByJudge.pro_edge_agent).toBe("Balanced Star");
  });

  it("does not return identical orderings for all non-risk judges", () => {
    const orders = ["data_scout", "power_hunter", "momentum_reader", "pro_edge_agent"].map((judgeId) =>
      rankCandidatesForJudge(judgeId as JudgeId, FIXTURES, 3).map((c) => c.playerName).join("|"),
    );
    const uniqueOrders = new Set(orders);
    expect(uniqueOrders.size).toBeGreaterThan(1);
  });
});

describe("single pick limits", () => {
  it("caps each judge between 1 and 3 singles", () => {
    for (const judgeId of ["data_scout", "power_hunter", "momentum_reader", "risk_auditor", "pro_edge_agent"] as JudgeId[]) {
      const limit = singlePickLimit(judgeId);
      expect(limit).toBeGreaterThanOrEqual(1);
      expect(limit).toBeLessThanOrEqual(3);
      expect(selectTopPicksForJudge(judgeId, FIXTURES).length).toBeLessThanOrEqual(limit);
    }
  });

  it("attaches judgeId to every generated pick", () => {
    const picks = selectTopPicksForJudge("power_hunter", FIXTURES);
    expect(picks.length).toBeGreaterThan(0);
    expect(picks.every((p) => p.judgeId === "power_hunter")).toBe(true);
  });
});

describe("judge pick metadata", () => {
  it("assigns specialty single labels instead of generic HR for every judge", () => {
    const labels = new Set(
      (["data_scout", "power_hunter", "momentum_reader", "risk_auditor", "pro_edge_agent"] as JudgeId[]).map(
        (judgeId) => judgePickMeta(judgeId).singlePickLabel,
      ),
    );

    expect(labels.has("Trap Avoid")).toBe(true);
    expect(labels.has("HR Single")).toBe(true);
    expect(labels.has("Form Single")).toBe(true);
    expect(labels.has("Safer HR Single")).toBe(true);
    expect(labels.has("Premium Blended Single")).toBe(true);
  });

  it("builds persona-specific reasoning", () => {
    const powerPick = FIXTURES.find((c) => c.playerName === "Power Slugger")!;
    const reason = buildJudgeReason("power_hunter", powerPick);
    expect(reason.toLowerCase()).toContain("power");
    expect(reason).toContain("92");
  });

  it("marks risk auditor picks as gradeable trap avoids", () => {
    const raPicks = selectTopPicksForJudge("risk_auditor", FIXTURES);
    expect(raPicks.length).toBeGreaterThan(0);
    expect(raPicks.every((p) => p.pickType === "AVOID")).toBe(true);
    expect(raPicks.every((p) => p.isAvoidPick === true)).toBe(true);
    expect(raPicks.every((p) => p.gradeable === true)).toBe(true);
    expect(judgePickMeta("risk_auditor").singlePickLabel).toBe("Trap Avoid");
  });

  it("does not emit parlay fields on singles", () => {
    const picks = selectTopPicksForJudge("power_hunter", FIXTURES);
    for (const pick of picks) {
      expect(pick).not.toHaveProperty("parlayEligible");
      expect(pick).not.toHaveProperty("parlayLeg");
    }
  });

  it("scores power hunter higher on raw power than data scout", () => {
    const powerPick = FIXTURES.find((c) => c.playerName === "Power Slugger")!;
    expect(agentScore("power_hunter", powerPick)).toBeGreaterThan(agentScore("data_scout", powerPick));
  });
});

describe("computeJudgeWinRate", () => {
  it("returns null when no decisive results exist", () => {
    expect(computeJudgeWinRate({ won: 0, lost: 0, pushed: 2 })).toBeNull();
  });

  it("computes win rate from won and lost only", () => {
    expect(computeJudgeWinRate({ won: 7, lost: 3, pushed: 1 })).toBe(70);
    expect(computeJudgeWinRate({ won: 1, lost: 0 })).toBe(100);
  });
});
