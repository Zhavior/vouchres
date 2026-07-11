import { describe, expect, it } from "vitest";
import {
  buildCustomTierFromFamily,
  CUSTOM_STAT_LIMITS,
  inferFamilyFromLeg,
  tierFromDraftLeg,
  validateCustomStatTarget,
} from "../src/lib/parlays/parlayCustomLine";
import { PARLAY_MARKET_FAMILIES } from "../src/lib/parlays/parlayMarketCatalog";
import { applyLegStatTargetEdit } from "../src/lib/parlays/parlayLegEditor";

describe("parlayCustomLine", () => {
  const runsFamily = PARLAY_MARKET_FAMILIES.find((f) => f.id === "runs")!;

  it("validates stat targets inside family limits", () => {
    expect(validateCustomStatTarget("runs", 3).valid).toBe(true);
    expect(validateCustomStatTarget("runs", 0).valid).toBe(false);
    expect(validateCustomStatTarget("runs", 99).valid).toBe(false);
  });

  it("builds a custom tier with canonical market code", () => {
    const tier = buildCustomTierFromFamily(runsFamily, 5);
    expect(tier?.marketCode).toBe("RUN");
    expect(tier?.statTarget).toBe(5);
    expect(tier?.id.startsWith("custom_")).toBe(true);
  });

  it("reconstructs tier from draft leg", () => {
    const leg = {
      id: "leg-1",
      source: "manual" as const,
      sport: "MLB",
      selection: "Aaron Judge 2+ Runs",
      marketCode: "RUN",
      marketLabel: "Runs Scored",
      statTarget: 2,
      comparator: ">=",
    };
    expect(inferFamilyFromLeg(leg)).toBe("runs");
    const tier = tierFromDraftLeg(leg);
    expect(tier?.statTarget).toBe(2);
    expect(tier?.marketCode).toBe("RUN");
  });

  it("documents grading-safe limits for each family", () => {
    expect(Object.keys(CUSTOM_STAT_LIMITS)).toHaveLength(7);
  });
});

describe("parlayLegEditor", () => {
  it("updates selection and eventKey when stat target changes", () => {
    const base = {
      id: "leg-1",
      source: "manual" as const,
      sport: "MLB",
      selection: "Aaron Judge 1+ Hit",
      playerName: "Aaron Judge",
      playerId: "592450",
      gamePk: "776655",
      marketCode: "HIT",
      marketLabel: "Total Hits",
      statTarget: 1,
      comparator: ">=",
      eventKey: "MLB_776655_592450_HIT_1_GTE",
    };

    const { leg, error } = applyLegStatTargetEdit(base, 3);
    expect(error).toBeUndefined();
    expect(leg.statTarget).toBe(3);
    expect(leg.selection).toContain("3+ Hit");
    expect(leg.eventKey).toContain("_HIT_3_");
    expect(leg.eventKey).not.toBe(base.eventKey);
  });
});
