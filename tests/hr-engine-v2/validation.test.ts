import { describe, expect, it } from "vitest";
import { validateSlate } from "../../server/services/mlb/hr-engine/v2/validation/validateSlate";
import type { HrEngineRequestV2 } from "../../server/services/mlb/hr-engine/v2/types";

function buildBaseRequest(): HrEngineRequestV2 {
  return {
    game: {
      gameId: "game-1",
      date: "2026-08-10",
      awayTeam: "NYY",
      homeTeam: "TOR",
      ballpark: "Rogers Centre",
      roofStatus: "closed",
      gameTimeLocal: "19:07",
      impliedTeamTotals: { away: 4.8, home: 4.2 },
      confirmedLineupsStatus: true,
    },
    batter: {
      batterId: 1,
      batterName: "Test Batter",
      team: "NYY",
      handedness: "R",
      projectedLineupSpot: 2,
      projectedPlateAppearances: 4.6,
      starterProbability: 1,
      seasonMetrics: {
        EV: 92,
        FB_percent: 41,
        HH_percent: 48,
        Barrel_percent: 14,
        xwOBAcon: 0.43,
        pull_air_percent: 0.34,
        avg_launch_angle: 17,
        sweet_spot_percent: 38,
      },
      rolling30dMetrics: {
        EV: 93,
        FB_percent: 44,
        HH_percent: 51,
        Barrel_percent: 16,
        xwOBAcon: 0.46,
        pull_air_percent: 0.36,
        avg_launch_angle: 18,
        air_hard_hit_rate: 0.29,
      },
      rolling14dBbeLog: [],
      pitchTypeSkill: null,
      splitProfile: {
        platoon_split_delta: 0.02,
        pull_side_hr_fit: 0.68,
      },
      lineupStatus: "confirmed",
    },
    pitcher: {
      pitcherId: 10,
      pitcherName: "Test Pitcher",
      handedness: "R",
      projectedInnings: 5.4,
      pitchMixUsage: {
        four_seam: 0.42,
        sinker: 0.08,
        cutter: 0.05,
        slider: 0.27,
        curve: 0.08,
        changeup: 0.10,
      },
      swingingStrikePercent: 11,
      whiffPercent: 27,
      hrPerFbAllowed: 0.14,
      barrelPercentAllowed: 9,
      flyBallPercentAllowed: 0.37,
      xSlgAllowed: 0.41,
      FIP: 3.82,
      xFIP: 3.95,
      recentPitchMixChange: 0.02,
      recentVelocityChange: 0.1,
      timesThroughOrderExpectation: 2.3,
    },
    bullpen: {
      bullpenId: "TOR-RP",
      last3DaysPitchCount: 92,
      last2DaysHighLeverageUsage: 3,
      projectedAvailableRelievers: 6,
      bullpenHrPerFb: 0.12,
      bullpenXFip: 3.97,
      bullpenBarrelPercentAllowed: 8.4,
      bullpenFatigueIndex: 0.39,
    },
    environment: {
      temperature: 72,
      humidity: 50,
      windSpeed: 0,
      windDirection: "calm",
      windVectorOutboundMph: 0,
      parkFactorHrOverall: 101,
      parkFactorPullLeft: 103,
      parkFactorPullRight: 99,
      parkFactorCenter: 100,
      weatherConfidence: "HIGH",
      roofStatus: "closed",
    },
    market: null,
  };
}

describe("validateSlate", () => {
  it("accepts a complete baseline request", () => {
    const result = validateSlate(buildBaseRequest());
    expect(result.dataQuality).not.toBe("INVALID");
  });

  it("marks missing batter identity as invalid", () => {
    const request = buildBaseRequest();
    request.batter.batterId = 0;

    const result = validateSlate(request);

    expect(result.dataQuality).toBe("INVALID");
    expect(result.reasons.join(" ")).toMatch(/batter/i);
  });

  it("marks missing pitcher identity as invalid", () => {
    const request = buildBaseRequest();
    request.pitcher.pitcherId = 0;

    const result = validateSlate(request);

    expect(result.dataQuality).toBe("INVALID");
    expect(result.reasons.join(" ")).toMatch(/pitcher/i);
  });

  it("marks missing game identity as invalid", () => {
    const request = buildBaseRequest();
    request.game.gameId = "";

    const result = validateSlate(request);

    expect(result.dataQuality).toBe("INVALID");
    expect(result.reasons.join(" ")).toMatch(/game/i);
  });

  it("downgrades missing season and rolling batter metrics", () => {
    const request = buildBaseRequest();
    request.batter.seasonMetrics = null;
    request.batter.rolling30dMetrics = null;

    const result = validateSlate(request);

    expect(["LOW", "MEDIUM"]).toContain(result.dataQuality);
    expect(result.downgraded).toBe(true);
  });

  it("downgrades unconfirmed lineup context", () => {
    const request = buildBaseRequest();
    request.game.confirmedLineupsStatus = false;
    request.batter.lineupStatus = "projected_unconfirmed";

    const result = validateSlate(request);

    expect(result.downgraded).toBe(true);
  });

  it("downgrades weak environment confidence", () => {
    const request = buildBaseRequest();
    request.environment.weatherConfidence = "LOW";

    const result = validateSlate(request);

    expect(result.downgraded).toBe(true);
  });
});
