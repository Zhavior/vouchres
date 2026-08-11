import { describe, expect, it } from "vitest";
import { buildDraftRequest } from "../../server/services/mlb/hr-engine/v2/adapters/buildDraftRequest";
import type { HrEligibleHitter } from "../../server/services/mlb/hr-engine/hrEngineTypes";
import type { DraftRequestDependencies } from "../../server/services/mlb/hr-engine/v2/adapters/buildDraftRequest";

const hitter: HrEligibleHitter = {
  playerId: 1,
  playerName: "Test Batter",
  position: "OF",
  teamId: 147,
  team: "NYY",
  teamName: "New York Yankees",
  opponentTeamId: 141,
  opponent: "TOR",
  opponentName: "Toronto Blue Jays",
  gamePk: 123,
  gameId: "123",
  venue: "Rogers Centre",
  opponentPitcherId: 10,
  opponentPitcherName: "Test Pitcher",
  lineupStatus: "confirmed",
};

const dependencies: DraftRequestDependencies = {
  game: {
    date: "2026-08-10",
    awayTeam: "NYY",
    homeTeam: "TOR",
    roofStatus: "closed",
    gameTimeLocal: "19:07",
    impliedTeamTotals: { away: 4.8, home: 4.2 },
  },
  batter: {
    handedness: "R",
    projectedLineupSpot: 2,
    projectedPlateAppearances: 4.6,
    starterProbability: 1,
    seasonMetrics: null,
  },
  pitcher: {
    handedness: "R",
    projectedInnings: null,
    pitchMixUsage: null,
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
  },
  bullpen: {
    bullpenId: "TOR-RP",
    last3DaysPitchCount: null,
    last2DaysHighLeverageUsage: null,
    projectedAvailableRelievers: null,
    bullpenHrPerFb: null,
    bullpenXFip: null,
    bullpenBarrelPercentAllowed: null,
    bullpenFatigueIndex: null,
  },
  environment: {
    temperature: null,
    humidity: null,
    windSpeed: null,
    windDirection: null,
    windVectorOutboundMph: null,
    parkFactorHrOverall: 100,
    parkFactorPullLeft: 100,
    parkFactorPullRight: 100,
    parkFactorCenter: 100,
    weatherConfidence: "LOW",
    roofStatus: "closed",
  },
};

describe("buildDraftRequest", () => {
  it("maps legacy identity and supplied dependencies without fabricating fields", () => {
    const result = buildDraftRequest(hitter, dependencies);

    expect(result.game.gameId).toBe("123");
    expect(result.game.awayTeam).toBe("NYY");
    expect(result.game.homeTeam).toBe("TOR");
    expect(result.game.ballpark).toBe("Rogers Centre");

    expect(result.batter.batterId).toBe(1);
    expect(result.batter.batterName).toBe("Test Batter");
    expect(result.batter.lineupStatus).toBe("confirmed");

    expect(result.pitcher.pitcherId).toBe(10);
    expect(result.pitcher.pitcherName).toBe("Test Pitcher");

    expect(result.batter.rolling30dMetrics).toBeNull();
    expect(result.batter.rolling14dBbeLog).toEqual([]);
    expect(result.batter.pitchTypeSkill).toBeNull();
    expect(result.market).toBeNull();
  });

  it("preserves missing legacy pitcher identity for downstream validation", () => {
    const result = buildDraftRequest(
      {
        ...hitter,
        opponentPitcherId: null,
        opponentPitcherName: null,
      },
      dependencies,
    );

    expect(result.pitcher.pitcherId).toBe(0);
    expect(result.pitcher.pitcherName).toBe("");
  });
});
