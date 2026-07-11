import { describe, expect, it } from "vitest";
import { assessTemplateProgress } from "../src/lib/parlays/templateProgress";
import { PARLAY_SLIP_TEMPLATES } from "../src/lib/parlays/parlaySlipTemplates";

describe("templateProgress", () => {
  it("tracks filled slots by marketCode and statTarget", () => {
    const progress = assessTemplateProgress("power_stack", [
      {
        id: "l1",
        source: "manual",
        sport: "MLB",
        selection: "Judge Anytime HR",
        marketCode: "ANYTIME_HR",
        statTarget: 1,
      },
      {
        id: "l2",
        source: "manual",
        sport: "MLB",
        selection: "Judge 2+ TB",
        marketCode: "TOTAL_BASES",
        statTarget: 2,
      },
    ]);

    expect(progress?.filledCount).toBe(2);
    expect(progress?.totalSlots).toBe(3);
    expect(progress?.complete).toBe(false);
  });

  it("marks template complete when min legs matched", () => {
    const template = PARLAY_SLIP_TEMPLATES.find((t) => t.id === "speed_utility")!;
    const progress = assessTemplateProgress("speed_utility", template.slots.map((slot, i) => ({
      id: `l${i}`,
      source: "manual" as const,
      sport: "MLB",
      selection: "Test",
      marketCode: i === 0 ? "STOLEN_BASE" : "RUN",
      statTarget: 1,
    })));
    expect(progress?.complete).toBe(true);
  });
});

describe("parlaySlipTemplates", () => {
  it("includes production template presets", () => {
    expect(PARLAY_SLIP_TEMPLATES.length).toBeGreaterThanOrEqual(4);
  });
});
