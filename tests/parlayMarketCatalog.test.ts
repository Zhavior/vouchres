import { describe, expect, it } from "vitest";
import {
  flattenTierLegs,
  inferFamilyFromText,
  PARLAY_MARKET_FAMILIES,
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
});
