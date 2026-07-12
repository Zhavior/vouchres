import { describe, expect, it } from "vitest";
import { assessParlayIdentity } from "../server/services/parlays/parlayIdentityService";
import {
  missingCanonicalIdentityFields,
  planLegacyLegIdentityRepair,
  singleCanonicalGameId,
} from "../server/services/parlays/legacyParlayIdentityRepairService";
import { isLegacyBacklogPickEligible } from "../server/services/grading/gradingService";

describe("legacy parlay identity repair", () => {
  it("builds canonical identity only from deterministic legacy fields", () => {
    const plan = planLegacyLegIdentityRepair({
      leg_index: 0,
      sport: "mlb",
      game_id: "777001",
      player_id: "592450",
      market: "Anytime HR",
      selection: "Aaron Judge 1+ HR",
      odds_decimal: 2.1,
    }, "repair_test");

    expect(plan.repairable).toBe(true);
    if (!plan.repairable) return;
    expect(plan.patch).toMatchObject({
      game_id: "777001",
      player_id: "592450",
      market_code: "ANYTIME_HR",
      stat_target: 1,
      comparator: ">=",
      external_provider: "repair_test",
    });
    expect(plan.patch).not.toHaveProperty("team_id");
    expect(assessParlayIdentity([{ leg_index: 0, ...plan.patch }])).toMatchObject({
      complete: true,
      missingLegIndexes: [],
    });
  });

  it("recovers a player id only from explicit selection metadata", () => {
    const plan = planLegacyLegIdentityRepair({
      game_id: "777001",
      market: "Home Run",
      selection: 'Aaron Judge 1+ HR ||meta: {"p":"592450"}',
    }, "repair_test");

    expect(plan.repairable).toBe(true);
    if (plan.repairable) expect(plan.patch.player_id).toBe("592450");
  });

  it("keeps ambiguous legacy rows unrepairable with bounded reasons", () => {
    const plan = planLegacyLegIdentityRepair({
      event_id: "manual-old-pick",
      market: "Player special",
      selection: "Unknown player",
    }, "repair_test");

    expect(plan).toEqual({
      repairable: false,
      reasons: [
        "missing_game_id",
        "missing_player_id",
        "unsupported_market",
        "missing_stat_target",
        "unsupported_comparator",
      ],
    });
  });

  it("reports the exact canonical fields blocking identity", () => {
    expect(missingCanonicalIdentityFields({
      event_key: "",
      market_code: "ANYTIME_HR",
      player_id: null,
      stat_target: 1,
      comparator: ">=",
    })).toEqual(["event_key", "player_id"]);
  });

  it("makes a repaired old parlay eligible for the bounded grade-due backlog", () => {
    const plan = planLegacyLegIdentityRepair({
      leg_index: 0,
      game_id: "777001",
      player_id: "592450",
      market: "Home Run",
    }, "repair_test");
    expect(plan.repairable).toBe(true);
    if (!plan.repairable) return;

    expect(isLegacyBacklogPickEligible({
      status: "pending",
      leg_type: "parlay",
      event_id: "777001",
    }, [{ leg_index: 0, ...plan.patch }])).toBe(true);
  });

  it("keeps incomplete or non-numeric legacy parlays out of grade-due", () => {
    expect(isLegacyBacklogPickEligible({
      status: "pending",
      leg_type: "parlay",
      event_id: "manual-old",
    }, [])).toBe(false);
  });

  it("syncs a parent event only when every leg has one identical numeric game", () => {
    expect(singleCanonicalGameId([{ game_id: "777001" }, { game_id: "777001" }])).toBe("777001");
    expect(singleCanonicalGameId([{ game_id: "777001" }, { game_id: "777002" }])).toBeNull();
    expect(singleCanonicalGameId([{ game_id: "777001" }, { game_id: null }])).toBeNull();
  });
});
