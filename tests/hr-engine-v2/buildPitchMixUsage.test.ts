import { describe, expect, it } from "vitest";
import { __pitchMixTestUtils } from "../../server/services/mlb/hr-engine/v2/adapters/buildPitchMixUsage";

describe("buildPitchMixUsage helpers", () => {
  it("maps common Statcast pitch labels into engine pitch groups", () => {
    expect(__pitchMixTestUtils.normalizePitchType("FF")).toBe("four_seam");
    expect(__pitchMixTestUtils.normalizePitchType("SI")).toBe("sinker");
    expect(__pitchMixTestUtils.normalizePitchType("FC")).toBe("cutter");
    expect(__pitchMixTestUtils.normalizePitchType("Sweeper")).toBe("slider");
    expect(__pitchMixTestUtils.normalizePitchType("KC")).toBe("curve");
    expect(__pitchMixTestUtils.normalizePitchType("Splitter")).toBe("changeup");
  });

  it("normalizes matched pitch usage into a 0-to-1 distribution", () => {
    const usage = __pitchMixTestUtils.buildUsageFromRows([
      {
        pitchType: "FF",
        pitchName: "4-Seam Fastball",
        pitchUsage: 40,
        woba: null,
        xwoba: null,
        whiffPct: null,
        hardHitPct: null,
        pitches: 100,
      },
      {
        pitchType: "SL",
        pitchName: "Slider",
        pitchUsage: 30,
        woba: null,
        xwoba: null,
        whiffPct: null,
        hardHitPct: null,
        pitches: 80,
      },
      {
        pitchType: "CH",
        pitchName: "Changeup",
        pitchUsage: 30,
        woba: null,
        xwoba: null,
        whiffPct: null,
        hardHitPct: null,
        pitches: 60,
      },
    ]);

    expect(usage).not.toBeNull();
    expect(usage?.four_seam).toBeCloseTo(0.4, 6);
    expect(usage?.slider).toBeCloseTo(0.3, 6);
    expect(usage?.changeup).toBeCloseTo(0.3, 6);
  });

  it("returns null when nothing maps to a supported pitch group", () => {
    const usage = __pitchMixTestUtils.buildUsageFromRows([
      {
        pitchType: "EP",
        pitchName: "Eephus",
        pitchUsage: 100,
        woba: null,
        xwoba: null,
        whiffPct: null,
        hardHitPct: null,
        pitches: 2,
      },
    ]);

    expect(usage).toBeNull();
  });
});
