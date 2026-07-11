import { describe, expect, it } from "vitest";
import { assessClientParlayIdentity } from "../src/lib/parlayIdentity";
import { validateParlayLegCandidate } from "../src/lib/parlays/parlayLegValidator";
import { assessSlipOdds } from "../src/lib/parlays/slipOddsPolicy";

describe("parlayOs lifecycle (client gates)", () => {
  it("blocks incomplete legs before they could be saved", () => {
    const validation = validateParlayLegCandidate({
      leg: {
        playerId: "660271",
        gamePk: "777001",
        marketCode: "ANYTIME_HR",
        statTarget: 1,
        comparator: ">=",
        eventKey: "MLB_777001_660271_ANYTIME_HR_1_GTE",
      },
    });
    expect(validation.valid).toBe(true);

    const identity = assessClientParlayIdentity([
      {
        playerId: "660271",
        gamePk: "777001",
        marketCode: "ANYTIME_HR",
        statTarget: 1,
        comparator: ">=",
      },
    ]);
    expect(identity.complete).toBe(true);
  });

  it("hides payout when slip has TBD odds", () => {
    const odds = assessSlipOdds([
      { odds: 150, oddsSource: "live" },
      { odds: null },
    ]);
    expect(odds.canShowPayout).toBe(false);
    expect(odds.canShowCombined).toBe(false);
  });
});
