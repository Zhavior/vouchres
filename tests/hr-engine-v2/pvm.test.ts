import { describe, expect, it } from "vitest";
import { calculatePVM } from "../../server/services/mlb/hr-engine/v2/components/pvm";
import type {
  BullpenProfileV2,
  PitcherProfileV2,
} from "../../server/services/mlb/hr-engine/v2/types";

const pitcher: PitcherProfileV2 = {
  pitcherId: 10,
  pitcherName: "Test Pitcher",
  handedness: "R",
  projectedInnings: 5.4,
  pitchMixUsage: {
    four_seam: 0.4,
    sinker: 0.1,
    cutter: 0.05,
    slider: 0.25,
    curve: 0.1,
    changeup: 0.1,
  },
  swingingStrikePercent: 11,
  whiffPercent: 27,
  hrPerFbAllowed: 0.14,
  barrelPercentAllowed: 0.09,
  flyBallPercentAllowed: 0.37,
  xSlgAllowed: 0.41,
  FIP: 3.82,
  xFIP: 3.95,
  recentPitchMixChange: 0.02,
  recentVelocityChange: 0.1,
  timesThroughOrderExpectation: 2.3,
};

const bullpen: BullpenProfileV2 = {
  bullpenId: "TOR-RP",
  last3DaysPitchCount: 92,
  last2DaysHighLeverageUsage: 3,
  projectedAvailableRelievers: 6,
  bullpenHrPerFb: 0.12,
  bullpenXFip: 3.97,
  bullpenBarrelPercentAllowed: 0.084,
  bullpenFatigueIndex: 0.39,
};

describe("calculatePVM", () => {
  it("does not flag a complete pitcher and bullpen profile", () => {
    const result = calculatePVM(pitcher, bullpen);

    expect(result.notes.some((note) => note.startsWith("PVM_PARTIAL"))).toBe(false);
  });

  it("flags missing pitcher inputs", () => {
    const result = calculatePVM(
      {
        ...pitcher,
        hrPerFbAllowed: null,
        barrelPercentAllowed: null,
        xSlgAllowed: null,
      },
      bullpen,
    );

    expect(result.notes.join(" ")).toMatch(/PVM_PARTIAL: pitcher/i);
    expect(result.notes.join(" ")).toMatch(/HR\/FB allowed/i);
    expect(result.notes.join(" ")).toMatch(/barrel rate allowed/i);
  });

  it("flags missing bullpen inputs", () => {
    const result = calculatePVM(pitcher, {
      ...bullpen,
      bullpenFatigueIndex: null,
      last3DaysPitchCount: null,
      bullpenBarrelPercentAllowed: null,
    });

    expect(result.notes.join(" ")).toMatch(/PVM_PARTIAL: bullpen/i);
    expect(result.notes.join(" ")).toMatch(/fatigue index/i);
    expect(result.notes.join(" ")).toMatch(/barrel rate allowed/i);
  });
});
