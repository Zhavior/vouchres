import { describe, expect, it } from "vitest";
import {
  flattenTierLegs,
  inferFamilyFromText,
  PARLAY_MARKET_FAMILIES,
  resolveParlayPlayerRole,
} from "../src/lib/parlays/parlayMarketCatalog";

describe("parlayMarketCatalog", () => {
  it("includes HR through 4-run tiers", () => {
    const runs = PARLAY_MARKET_FAMILIES.find((f) => f.id === "runs");
    expect(runs?.tiers).toHaveLength(4);
    const hrs = PARLAY_MARKET_FAMILIES.find((f) => f.id === "home_runs");
    expect(hrs?.tiers.some((t) => t.id === "hr_2plus")).toBe(true);
  });

  it("infers pitcher family from strikeout text", () => {
    expect(inferFamilyFromText("Gerrit Cole 6+ Strikeouts")).toBe("pitcher");
  });

  it("expands combo tiers into multiple legs", () => {
    const combo = PARLAY_MARKET_FAMILIES
      .find((f) => f.id === "home_runs")
      ?.tiers.find((t) => t.id === "hr_run_combo");
    expect(combo).toBeTruthy();
    expect(flattenTierLegs(combo!)).toHaveLength(2);
  });

  it("keeps HR props on batter role even when spec mentions pitcher K rate", () => {
    expect(resolveParlayPlayerRole({
      position: "RF",
      marketHint: "Home Run",
      specHint: "Aaron Judge Anytime HR vs Smith (11 K/9)",
    })).toBe("batter");
  });

  it("uses pitcher role for SP position", () => {
    expect(resolveParlayPlayerRole({
      position: "SP",
      marketHint: "Strikeouts",
      specHint: "Gerrit Cole 6+ K",
    })).toBe("pitcher");
  });
});
