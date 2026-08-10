import { describe, expect, it } from "vitest";
import { calculateOVS } from "../../server/services/mlb/hr-engine/v2/components/ovs";
import type {
  BatterProfileV2,
  GameContextV2,
} from "../../server/services/mlb/hr-engine/v2/types";

const game: GameContextV2 = {
  gameId: "game-1",
  date: "2026-08-10",
  awayTeam: "NYY",
  homeTeam: "TOR",
  ballpark: "Rogers Centre",
  roofStatus: "closed",
  gameTimeLocal: "19:07",
  impliedTeamTotals: { away: 4.8, home: 4.2 },
  confirmedLineupsStatus: true,
};

const batter: BatterProfileV2 = {
  batterId: 1,
  batterName: "Test Batter",
  team: "NYY",
  handedness: "R",
  projectedLineupSpot: 2,
  projectedPlateAppearances: 4.6,
  starterProbability: 1,
  seasonMetrics: null,
  rolling30dMetrics: null,
  rolling14dBbeLog: [],
  pitchTypeSkill: null,
  splitProfile: {
    platoon_split_delta: 0,
    pull_side_hr_fit: 0.75,
  },
  lineupStatus: "confirmed",
};

describe("calculateOVS", () => {
  it("does not flag a complete opportunity profile", () => {
    const result = calculateOVS(batter, game);

    expect(result.notes.some((note) => note.startsWith("OVS_PARTIAL"))).toBe(false);
  });

  it("flags missing batter opportunity inputs", () => {
    const result = calculateOVS(
      {
        ...batter,
        projectedLineupSpot: null,
        projectedPlateAppearances: null,
        starterProbability: null,
      },
      game,
    );

    expect(result.notes.join(" ")).toMatch(/OVS_PARTIAL/i);
    expect(result.notes.join(" ")).toMatch(/projected plate appearances/i);
    expect(result.notes.join(" ")).toMatch(/projected lineup spot/i);
    expect(result.notes.join(" ")).toMatch(/starter probability/i);
  });

  it("flags an invalid team implied total", () => {
    const result = calculateOVS(batter, {
      ...game,
      impliedTeamTotals: { away: Number.NaN, home: 4.2 },
    });

    expect(result.notes.join(" ")).toMatch(/OVS_PARTIAL/i);
    expect(result.notes.join(" ")).toMatch(/team implied total/i);
  });
});
