import { describe, expect, it } from "vitest";
import { isAnytimeHrMarket } from "../server/services/grading/liveHrParlayService";

describe("isAnytimeHrMarket", () => {
  it("accepts canonical market codes", () => {
    expect(isAnytimeHrMarket("x", "y", "HR")).toBe(true);
    expect(isAnytimeHrMarket("x", "y", "ANYTIME_HR")).toBe(true);
    expect(isAnytimeHrMarket("x", "y", "HOME_RUN")).toBe(true);
  });

  it("rejects non-HR market codes even if text mentions hr substring", () => {
    expect(isAnytimeHrMarket("threshold", "player", "TOTAL")).toBe(false);
    expect(isAnytimeHrMarket("hr", "player", "HITS")).toBe(false);
  });

  it("uses word-boundary text matching when market_code is absent", () => {
    expect(isAnytimeHrMarket("Player HR", "to hit a home run")).toBe(true);
    expect(isAnytimeHrMarket("homer", "yes")).toBe(true);
    expect(isAnytimeHrMarket("threshold", "over")).toBe(false);
    expect(isAnytimeHrMarket("other", "misc")).toBe(false);
  });
});
