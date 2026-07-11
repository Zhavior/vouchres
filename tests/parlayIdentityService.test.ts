import { describe, expect, it } from "vitest";
import { assessParlayIdentity, isLegIdentityComplete } from "../server/services/parlays/parlayIdentityService";

describe("parlayIdentityService", () => {
  it("marks a leg complete when canonical identity fields exist", () => {
    expect(isLegIdentityComplete({
      event_key: "MLB_123_TEAM_PLAYER_ANYTIME_HR_1_GTE",
      market_code: "ANYTIME_HR",
      player_id: "660271",
      stat_target: 1,
      comparator: ">=",
    })).toBe(true);
  });

  it("marks a leg incomplete when required fields are missing", () => {
    expect(isLegIdentityComplete({
      event_key: "",
      market_code: "ANYTIME_HR",
      player_id: "660271",
      stat_target: 1,
      comparator: ">=",
    })).toBe(false);
  });

  it("assesses parlay identity across legs", () => {
    const assessment = assessParlayIdentity([
      {
        leg_index: 0,
        event_key: "MLB_123_TEAM_PLAYER_ANYTIME_HR_1_GTE",
        market_code: "ANYTIME_HR",
        player_id: "660271",
        stat_target: 1,
        comparator: ">=",
      },
      {
        leg_index: 1,
        event_key: "",
        market_code: "ANYTIME_HR",
        player_id: "592450",
        stat_target: 1,
        comparator: ">=",
      },
    ]);

    expect(assessment.complete).toBe(false);
    expect(assessment.totalLegs).toBe(2);
    expect(assessment.completeLegs).toBe(1);
    expect(assessment.missingLegIndexes).toEqual([1]);
  });
});
