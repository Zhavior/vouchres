import { describe, expect, it } from "vitest";
import { assessSlipOdds } from "../src/lib/parlays/slipOddsPolicy";

describe("slipOddsPolicy", () => {
  it("blocks payout when any leg has TBD odds", () => {
    const result = assessSlipOdds([
      { odds: 150 },
      { odds: null },
    ]);
    expect(result.canShowPayout).toBe(false);
    expect(result.hasTbdLegs).toBe(true);
    expect(result.blockReason).toMatch(/TBD/i);
  });

  it("shows combined but hides payout for estimated legs", () => {
    const result = assessSlipOdds([
      { odds: 150, oddsSource: "live" },
      { odds: 200, oddsSource: "estimated" },
    ]);
    expect(result.canShowCombined).toBe(true);
    expect(result.canShowPayout).toBe(false);
    expect(result.hasEstimatedLegs).toBe(true);
  });

  it("allows payout when all legs have live odds", () => {
    const result = assessSlipOdds([
      { odds: 150, oddsSource: "live" },
      { odds: -110, oddsSource: "live" },
    ]);
    expect(result.canShowPayout).toBe(true);
    expect(result.combined?.american).toBeTruthy();
  });
});
