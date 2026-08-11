import { describe, expect, it } from "vitest";
import { calculateEPV } from "../../server/services/mlb/hr-engine/v2/components/epv";
import { calculatePCQI } from "../../server/services/mlb/hr-engine/v2/components/pcqi";
import { calculateOVS } from "../../server/services/mlb/hr-engine/v2/components/ovs";
import { runHrModel, sigmoid } from "../../server/services/mlb/hr-engine/v2/model/logit";
import type {
  BatterProfileV2,
  EnvironmentVectorV2,
  GameContextV2,
} from "../../server/services/mlb/hr-engine/v2/types";

const batter: BatterProfileV2 = {
  batterId: 1,
  batterName: "Test Batter",
  team: "NYY",
  handedness: "R",
  projectedLineupSpot: 2,
  projectedPlateAppearances: 4.7,
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

const game: GameContextV2 = {
  gameId: "game-1",
  date: "2026-08-10",
  awayTeam: "NYY",
  homeTeam: "TOR",
  ballpark: "Rogers Centre",
  roofStatus: "open",
  gameTimeLocal: "19:07",
  impliedTeamTotals: { away: 5.2, home: 4.2 },
  confirmedLineupsStatus: true,
};

const neutralEnvironment: EnvironmentVectorV2 = {
  temperature: 72,
  humidity: 50,
  windSpeed: 0,
  windDirection: "calm",
  windVectorOutboundMph: 0,
  parkFactorHrOverall: 100,
  parkFactorPullLeft: 100,
  parkFactorPullRight: 100,
  parkFactorCenter: 100,
  weatherConfidence: "HIGH",
  roofStatus: "open",
};

describe("HR engine v2 model", () => {
  it("calculates a sigmoid in the valid probability range", () => {
    expect(sigmoid(-100)).toBeGreaterThan(0);
    expect(sigmoid(100)).toBeGreaterThan(0.999);
    expect(sigmoid(0)).toBe(0.5);
  });

  it("bounds model output to the configured HR probability range", () => {
    const result = runHrModel({
      PCQI: 1,
      ZFAS: 1,
      PVM: 1,
      EPV: 1,
      OVS: 1,
    });

    expect(result.pRaw).toBeGreaterThan(0);
    expect(result.pRaw).toBeLessThan(1);
    expect(result.pModel).toBeGreaterThanOrEqual(0.03);
    expect(result.pModel).toBeLessThanOrEqual(0.4);
  });

  it("marks PCQI as partial when rolling Statcast inputs are unavailable", () => {
    const partialBatter = {
      ...batter,
      rolling14dBbeLog: [],
      rolling30dMetrics: null,
    };

    const result = calculatePCQI(partialBatter);

    expect(result.notes).toContain(
      "PCQI_PARTIAL: 14-day batted-ball events unavailable.",
    );
    expect(result.notes).toContain(
      "PCQI_PARTIAL: 30-day Statcast metrics unavailable.",
    );
  });

  it("rewards a favorable projected opportunity profile", () => {
    const favorable = calculateOVS(batter, game);
    const lowOpportunity = calculateOVS(
      {
        ...batter,
        projectedLineupSpot: 9,
        projectedPlateAppearances: 3,
        starterProbability: 0.5,
      },
      {
        ...game,
        impliedTeamTotals: { away: 3, home: 4.2 },
      },
    );

    expect(favorable.value).toBeGreaterThan(lowOpportunity.value);
  });

  it("increases EPV for open-roof outbound wind", () => {
    const neutral = calculateEPV(batter, neutralEnvironment);
    const favorable = calculateEPV(batter, {
      ...neutralEnvironment,
      temperature: 88,
      windSpeed: 14,
      windDirection: "out",
      windVectorOutboundMph: 14,
      parkFactorHrOverall: 112,
      parkFactorPullLeft: 118,
    });

    expect(favorable.value).toBeGreaterThan(neutral.value);
  });

  it("ignores outdoor wind and temperature under a closed roof", () => {
    const closedNeutral = calculateEPV(batter, {
      ...neutralEnvironment,
      roofStatus: "closed",
    });

    const closedWindy = calculateEPV(batter, {
      ...neutralEnvironment,
      roofStatus: "closed",
      temperature: 95,
      windSpeed: 25,
      windDirection: "out",
      windVectorOutboundMph: 25,
    });

    expect(closedWindy.value).toBe(closedNeutral.value);
  });
});
