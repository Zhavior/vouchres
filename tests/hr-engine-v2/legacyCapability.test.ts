import { describe, expect, it } from "vitest";
import { assessLegacyV2Capability } from "../../server/services/mlb/hr-engine/v2/legacyCapability";
import type { HrEligibleHitter } from "../../server/services/mlb/hr-engine/hrEngineTypes";

const hitter: HrEligibleHitter = {
  playerId: 1,
  playerName: "Test Batter",
  position: "Outfielder",
  teamId: 147,
  team: "NYY",
  teamName: "New York Yankees",
  opponentTeamId: 141,
  opponent: "TOR",
  opponentName: "Toronto Blue Jays",
  gamePk: 123,
  gameId: "123",
  venue: "Rogers Centre",
  opponentPitcherId: 10,
  opponentPitcherName: "Test Pitcher",
  lineupStatus: "confirmed",
};

describe("assessLegacyV2Capability", () => {
  it("fails closed rather than fabricating a v2 request", () => {
    const result = assessLegacyV2Capability(hitter);

    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/insufficient/i);
    expect(result.missing).toContain("Statcast season metrics");
    expect(result.missing).toContain("bullpen availability and quality");
    expect(result.missing).toContain("market odds");
  });

  it("reports absent legacy identity fields", () => {
    const result = assessLegacyV2Capability({
      ...hitter,
      playerId: 0,
      opponentPitcherId: null,
      opponentPitcherName: null,
    });

    expect(result.missing).toContain("batter identity");
    expect(result.missing).toContain("opposing pitcher identity");
  });
});
