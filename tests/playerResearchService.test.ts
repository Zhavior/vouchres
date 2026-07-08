import { describe, expect, it, vi } from "vitest";
import { generatePlayerResearch } from "../server/services/ai/playerResearchService";
import { PlayerResearchRequestSchema } from "../server/validators/aiSchemas";

const playerData = {
  id: "592450",
  name: "Aaron Judge",
  team: "NYY",
  position: "OF",
  number: "99",
  injuryStatus: "Healthy",
  injurySeverity: "NONE",
  seasonStats: { avg: ".312", hr: "44", rbi: "95", ops: "1.034" },
  advanced: {
    hardHitPercent: 61.2,
    exitVelocity: 96.1,
    chasePercent: 21.4,
    woba: 0.431,
    xwoba: 0.456,
  },
  splits: {
    vRHP: { avg: ".300", obp: ".410", slg: ".620", ops: "1.030" },
    vLHP: { avg: ".320", obp: ".440", slg: ".660", ops: "1.100" },
    home: { avg: ".310", obp: ".420", slg: ".650", ops: "1.070" },
    away: { avg: ".305", obp: ".400", slg: ".620", ops: "1.020" },
    last10: { avg: ".360", obp: ".480", slg: ".720", ops: "1.200" },
  },
};

describe("PlayerResearchRequestSchema", () => {
  it("accepts the frontend player shape and rejects unsafe metric ranges", () => {
    expect(PlayerResearchRequestSchema.safeParse({ playerData }).success).toBe(true);
    expect(
      PlayerResearchRequestSchema.safeParse({
        playerData: {
          ...playerData,
          advanced: { ...playerData.advanced, chasePercent: 999 },
        },
      }).success
    ).toBe(false);
  });

  it("requires key stat groups", () => {
    const { seasonStats: _seasonStats, ...missingStats } = playerData;
    expect(PlayerResearchRequestSchema.safeParse({ playerData: missingStats }).success).toBe(false);
  });
});

describe("generatePlayerResearch", () => {
  it("returns a bounded local report without a Gemini key", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");

    const result = await generatePlayerResearch(PlayerResearchRequestSchema.parse({ playerData }));

    expect(result.status).toBe("simulated");
    expect(result.aiScore).toBeGreaterThanOrEqual(10);
    expect(result.aiScore).toBeLessThanOrEqual(99);
    expect(result.riskLevel).toBe("LOW");
    expect(result.confidenceBand).toBe("Strong");
    expect(result.report).toContain("Aaron Judge");
    expect(result.report).toContain("Not betting advice");

    vi.unstubAllEnvs();
  });
});
