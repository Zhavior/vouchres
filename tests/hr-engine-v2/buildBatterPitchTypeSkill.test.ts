import { describe, expect, it } from "vitest";
import { buildBatterPitchTypeSkillFromRows } from "../../server/services/mlb/hr-engine/v2/adapters/buildBatterPitchTypeSkill";
import type { StatcastPitchMixRow } from "../../server/services/mlb/statcastClient";

function row(overrides: Partial<StatcastPitchMixRow>): StatcastPitchMixRow {
  return {
    pitchType: "FF",
    pitchName: "4-Seam Fastball",
    pitchUsage: 42,
    woba: 0.34,
    xwoba: 0.36,
    xslg: 0.51,
    whiffPct: 24,
    hardHitPct: 47,
    pitches: 220,
    pa: 64,
    ...overrides,
  };
}

describe("buildBatterPitchTypeSkillFromRows", () => {
  it("maps official Savant pitch-type xwOBA and PA samples without guessing", () => {
    const skill = buildBatterPitchTypeSkillFromRows([
      row({ pitchType: "FF", xwoba: 0.36, pa: 64 }),
      row({ pitchType: "SL", pitchName: "Slider", xwoba: 0.31, pa: 41 }),
    ]);

    expect(skill?.xwOBA_vs_4seam).toBe(0.36);
    expect(skill?.xwOBA_vs_slider).toBe(0.31);
    expect(skill?.sampleCounts?.four_seam).toBe(64);
    expect(skill?.sampleCounts?.slider).toBe(41);
  });

  it("returns null when rows lack supported, source-backed xwOBA", () => {
    expect(buildBatterPitchTypeSkillFromRows([
      row({ pitchType: "KN", pitchName: "Knuckleball" }),
      row({ pitchType: "FF", xwoba: null }),
    ])).toBeNull();
  });
});
