import { describe, expect, it } from "vitest";
import { resolvePitcherKOutcome } from "../server/services/intelligence/centralBrain/brainLedgerService";

describe("pitcher K settlement", () => {
  it("grades the frozen 5+ target from official pitching totals", () => {
    expect(resolvePitcherKOutcome({ inningsPitched: "6.0", strikeOuts: 7 }, 5)).toBe("hit");
    expect(resolvePitcherKOutcome({ inningsPitched: "5.0", strikeOuts: 4 }, 5)).toBe("miss");
  });

  it("voids a listed probable pitcher who never appears", () => {
    expect(resolvePitcherKOutcome(undefined, 5)).toBe("void");
    expect(resolvePitcherKOutcome({ inningsPitched: "0.0", strikeOuts: 0 }, 5)).toBe("void");
  });

  it("refuses to grade a decision with an invalid target", () => {
    expect(resolvePitcherKOutcome({ inningsPitched: "6.0", strikeOuts: 7 }, 0)).toBeNull();
  });
});
