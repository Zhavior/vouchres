import { describe, expect, it } from "vitest";
import { resolveMarket } from "../src/sports/markets";
import { getParlayMarketFamilies } from "../src/lib/parlays/parlayMarketCatalog";
import { isParlaySportFullyReady, PARLAY_SPORT_CAPABILITIES } from "../src/sports/parlaySportCapabilities";

describe("NFL parlay extensibility", () => {
  it("resolves NFL touchdown markets", () => {
    expect(resolveMarket("nfl", "Anytime TD", "Josh Allen Anytime Touchdown")).toEqual({
      marketCode: "touchdown",
      threshold: 1,
    });
  });

  it("exposes empty NFL market catalog until families are defined", () => {
    expect(getParlayMarketFamilies("nfl")).toEqual([]);
    expect(getParlayMarketFamilies("mlb").length).toBeGreaterThan(0);
  });

  it("documents NFL as save/grade-preview ready only", () => {
    expect(PARLAY_SPORT_CAPABILITIES.nfl.save).toBe(true);
    expect(PARLAY_SPORT_CAPABILITIES.nfl.gradePreview).toBe(true);
    expect(PARLAY_SPORT_CAPABILITIES.nfl.marketCatalog).toBe(false);
    expect(isParlaySportFullyReady("nfl")).toBe(false);
    expect(isParlaySportFullyReady("mlb")).toBe(true);
  });
});
