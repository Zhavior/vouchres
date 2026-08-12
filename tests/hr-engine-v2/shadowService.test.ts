import { describe, expect, it } from "vitest";
import { buildHrV2ShadowRequest } from "../../server/services/mlb/hr-engine/v2/shadowService";
import type { PitcherProfileV2 } from "../../server/services/mlb/hr-engine/v2/types";
import type { ScoredHrCandidate } from "../../server/services/mlb/hrValidation";
import type { NormalizedGame } from "../../server/services/mlb/mlbTypes";

const candidate: ScoredHrCandidate = {
  playerId: 42,
  playerName: "Source Backed Batter",
  team: "NYY",
  teamId: 147,
  teamAbbrev: "NYY",
  opponent: "TOR",
  opponentTeamId: 141,
  gamePk: 123,
  opponentPitcherName: "Source Backed Pitcher",
  opponentPitcher: "Source Backed Pitcher",
  opponentPitcherId: 10,
  opponentPitcherHand: "R",
  batSide: "L",
  lineupStatus: "confirmed",
  battingOrder: 2,
  injuryStatus: "healthy",
  hrScore: 70,
  dataConfidence: 80,
  riskTier: "Playable",
  status: "confirmed",
  reasons: [],
  warnings: [],
  dataQuality: "partial",
  lastUpdated: "2026-08-11T12:00:00.000Z",
  dataSource: "MLB Stats API",
};

const game: NormalizedGame = {
  gamePk: 123,
  gameDate: "2026-08-11T23:05:00Z",
  status: "Scheduled",
  awayTeam: { teamId: 147, name: "New York Yankees", abbreviation: "NYY" },
  homeTeam: { teamId: 141, name: "Toronto Blue Jays", abbreviation: "TOR" },
  venue: "Rogers Centre",
  probablePitchers: { away: null, home: null },
  score: { away: 0, home: 0 },
  inning: null,
  linescore: null,
  weather: { tempF: 72, windMph: 5, windDir: "N" },
  bettingContext: null,
  aiContext: null,
  dataQuality: "partial",
};

const pitcher: PitcherProfileV2 = {
  pitcherId: 10,
  pitcherName: "Source Backed Pitcher",
  handedness: "R",
  projectedInnings: 5.6,
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
};

describe("buildHrV2ShadowRequest", () => {
  it("uses MLB-derived PA and leaves market/team totals unavailable", () => {
    const request = buildHrV2ShadowRequest(candidate, {
      game,
      hitterStats: {
        playerId: 42,
        season: {
          homeRuns: 25,
          atBats: 400,
          plateAppearances: 450,
          avg: 0.27,
          slg: 0.52,
          ops: 0.9,
          hrPerPA: 25 / 450,
          gamesPlayed: 100,
          onBasePercentage: 0.38,
          stolenBases: 3,
          caughtStealing: 1,
        },
        recentGames: [],
      },
      seasonMetrics: null,
      pitchTypeSkill: null,
      pitcher,
    });

    expect(request?.batter.projectedPlateAppearances).toBe(4.5);
    expect(request?.batter.starterProbability).toBe(1);
    expect(request?.game.impliedTeamTotals).toEqual({ away: null, home: null });
    expect(request?.market).toBeNull();
    expect(request?.environment.windVectorOutboundMph).toBeNull();
  });

  it("refuses projected candidates instead of inventing starter context", () => {
    expect(buildHrV2ShadowRequest(
      { ...candidate, lineupStatus: "projected_unconfirmed" },
      {
        game,
        hitterStats: { playerId: 42, season: null, recentGames: [] },
        seasonMetrics: null,
        pitchTypeSkill: null,
        pitcher,
      },
    )).toBeNull();
  });
});
