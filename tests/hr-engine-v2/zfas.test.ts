import { describe, expect, it } from "vitest";
import { calculateZFAS } from "../../server/services/mlb/hr-engine/v2/components/zfas";
import type {
  BatterProfileV2,
  PitcherProfileV2,
} from "../../server/services/mlb/hr-engine/v2/types";

const batter: BatterProfileV2 = {
  batterId: 1,
  batterName: "Test Batter",
  team: "NYY",
  handedness: "L",
  projectedLineupSpot: 2,
  projectedPlateAppearances: 4.6,
  starterProbability: 1,
  seasonMetrics: null,
  rolling30dMetrics: null,
  rolling14dBbeLog: [],
  pitchTypeSkill: {
    xwOBA_vs_4seam: 0.38,
    sampleCounts: { four_seam: 80 },
  },
  splitProfile: {
    platoon_split_delta: 0.03,
    pull_side_hr_fit: 0.72,
  },
  lineupStatus: "confirmed",
};

const pitcher: PitcherProfileV2 = {
  pitcherId: 10,
  pitcherName: "Test Pitcher",
  handedness: "R",
  projectedInnings: 5.5,
  pitchMixUsage: {
    four_seam: 0.45,
    sinker: 0,
    cutter: 0,
    slider: 0.3,
    curve: 0.1,
    changeup: 0.15,
  },
  swingingStrikePercent: null,
  whiffPercent: null,
  hrPerFbAllowed: null,
  barrelPercentAllowed: null,
  flyBallPercentAllowed: null,
  xSlgAllowed: null,
  FIP: null,
  xFIP: null,
  recentPitchMixChange: null,
  recentVelocityChange: null,
  timesThroughOrderExpectation: null,
};

describe("calculateZFAS", () => {
  it("does not flag complete matchup inputs", () => {
    const result = calculateZFAS(batter, pitcher);

    expect(result.notes.some((note) => note.startsWith("ZFAS_PARTIAL"))).toBe(false);
  });

  it("flags missing pitch-type matchup inputs", () => {
    const result = calculateZFAS(
      {
        ...batter,
        pitchTypeSkill: null,
        splitProfile: null,
        projectedLineupSpot: null,
        starterProbability: null,
      },
      {
        ...pitcher,
        pitchMixUsage: null,
        projectedInnings: null,
      },
    );

    const notes = result.notes.join(" ");

    expect(notes).toMatch(/ZFAS_PARTIAL/i);
    expect(notes).toMatch(/pitcher pitch mix/i);
    expect(notes).toMatch(/batter pitch-type skill/i);
    expect(notes).toMatch(/projected starter innings/i);
    expect(notes).toMatch(/batter platoon split profile/i);
  });

  it("retains a bounded score when matchup data is incomplete", () => {
    const result = calculateZFAS(
      { ...batter, pitchTypeSkill: null },
      { ...pitcher, pitchMixUsage: null },
    );

    expect(result.value).toBeGreaterThanOrEqual(0);
    expect(result.value).toBeLessThanOrEqual(1);
  });
});
