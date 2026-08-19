import { describe, expect, it } from "vitest";
import { assessSlipOdds } from "../src/lib/parlays/slipOddsPolicy";
import { draftLegsToUiLegs } from "../src/lib/parlays/draftLegsToUiLegs";
import type { DraftParlayLeg } from "../src/stores/parlayCommandStore";

function draftLeg(over: Partial<DraftParlayLeg> & { id: string }): DraftParlayLeg {
  return {
    source: "manual",
    sport: "MLB",
    selection: "Player HR",
    marketCode: "home_run",
    odds: "+300",
    ...over,
  } as DraftParlayLeg;
}

describe("assessSlipOdds — correlation-aware pricing", () => {
  it("leaves cross-game slips on the plain independent product", () => {
    const result = assessSlipOdds(draftLegsToUiLegs([
      draftLeg({ id: "a", gamePk: "1", playerId: 1, teamId: 100 }),
      draftLeg({ id: "b", gamePk: "2", playerId: 2, teamId: 200 }),
    ]));

    expect(result.canShowCombined).toBe(true);
    expect(result.correlated).toBe(false);
    // 4.0 x 4.0 = 16
    expect(result.combined?.decimal).toBeCloseTo(16, 1);
    expect(result.combined?.decimal).toBeCloseTo(result.naive!.decimal, 1);
  });

  it("shortens a same-game stack below the naive product", () => {
    const result = assessSlipOdds(draftLegsToUiLegs([
      draftLeg({ id: "a", gamePk: "5", playerId: 1, teamId: 100, marketCode: "home_run" }),
      draftLeg({ id: "b", gamePk: "5", playerId: 1, teamId: 100, marketCode: "total_bases", odds: "-140" }),
      draftLeg({ id: "c", gamePk: "5", playerId: 2, teamId: 100, marketCode: "rbi", odds: "+120" }),
    ]));

    expect(result.correlated).toBe(true);
    expect(result.combined!.decimal).toBeLessThan(result.naive!.decimal);
  });

  it("lengthens legs that fight each other", () => {
    const result = assessSlipOdds(draftLegsToUiLegs([
      draftLeg({ id: "a", gamePk: "5", playerId: 1, teamId: 100, marketCode: "home_run" }),
      draftLeg({ id: "b", gamePk: "5", playerId: 9, teamId: 200, marketCode: "pitcher_strikeouts", odds: "-120" }),
    ]));

    expect(result.correlated).toBe(true);
    expect(result.combined!.decimal).toBeGreaterThan(result.naive!.decimal);
  });

  it("still refuses to price a slip with a TBD leg", () => {
    const result = assessSlipOdds(draftLegsToUiLegs([
      draftLeg({ id: "a", gamePk: "5", playerId: 1 }),
      draftLeg({ id: "b", gamePk: "5", playerId: 2, odds: null }),
    ]));

    expect(result.canShowCombined).toBe(false);
    expect(result.canShowPayout).toBe(false);
    expect(result.combined).toBeNull();
    expect(result.naive).toBeNull();
    expect(result.blockReason).toMatch(/Odds TBD/);
  });

  it("still hides payout when a leg uses estimated odds", () => {
    const result = assessSlipOdds([
      { id: "a", odds: 300, gamePk: "5", playerId: 1, marketCode: "home_run" },
      { id: "b", odds: 250, gamePk: "5", playerId: 2, marketCode: "rbi", oddsSource: "estimated" },
    ]);

    expect(result.canShowCombined).toBe(true);
    expect(result.canShowPayout).toBe(false);
    expect(result.blockReason).toMatch(/estimated/);
  });

  it("prices identically across repeated calls for the same slip", () => {
    const legs = draftLegsToUiLegs([
      draftLeg({ id: "a", gamePk: "5", playerId: 1, teamId: 100, marketCode: "home_run" }),
      draftLeg({ id: "b", gamePk: "5", playerId: 1, teamId: 100, marketCode: "total_bases" }),
    ]);
    // A price that drifted between renders would read as a live line move.
    expect(assessSlipOdds(legs).combined!.decimal)
      .toBe(assessSlipOdds(legs).combined!.decimal);
  });

  it("treats a caller with no correlation metadata as independent", () => {
    // ParlayBuilderRail maps its own leg shape and passes odds only.
    const result = assessSlipOdds([{ odds: "+300" }, { odds: "+300" }]);
    expect(result.correlated).toBe(false);
    expect(result.combined?.decimal).toBeCloseTo(16, 1);
  });
});
