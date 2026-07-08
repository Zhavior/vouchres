import { describe, expect, it } from "vitest";
import type { GameContext, TodayPlayer } from "../server/services/mlb/hrValidation";
import {
  validateHrCandidate,
  validateProjectedPreviewCandidate,
} from "../server/services/mlb/hrValidator";

const today = new Date().toISOString().slice(0, 10);

const game: GameContext = {
  gamePk: 777001,
  gameDate: today,
  awayTeamId: 111,
  homeTeamId: 222,
  awayTeamAbbrev: "NYY",
  homeTeamAbbrev: "BOS",
  probablePitchers: {
    away: { pitcherId: 1001, pitcherName: "Away Pitcher", teamId: 111, throws: "R" },
    home: { pitcherId: 1002, pitcherName: "Home Pitcher", teamId: 222, throws: "L" },
  },
  status: "Scheduled",
};

const confirmedHomePlayer: TodayPlayer = {
  playerId: 592450,
  playerName: "Aaron Judge",
  teamId: 222,
  teamAbbrev: "BOS",
  sourceTeamName: "Boston Red Sox",
  sourceTeamId: 222,
  sourceTeamAbbrev: "BOS",
  playerCurrentTeamId: 222,
  activeRosterTeamId: 222,
  opponentTeamId: 111,
  gamePk: 777001,
  gameDate: today,
  homeOrAway: "home",
  battingHand: "R",
  lineupStatus: "confirmed",
  battingOrder: 3,
  activeRosterStatus: true,
  injuryStatus: "healthy",
  lastUpdated: new Date().toISOString(),
  dataSource: "mlb_statsapi",
};

describe("validateHrCandidate", () => {
  it("blocks confirmed candidates with team mismatch / stale roster assignment", () => {
    const mismatched: TodayPlayer = {
      ...confirmedHomePlayer,
      sourceTeamId: 111,
      sourceTeamAbbrev: "NYY",
    };

    const result = validateHrCandidate(
      mismatched,
      game,
      "healthy",
      true,
      true,
      new Set<number>(),
    );

    expect(result.valid).toBe(false);
    expect(result.status).toBe("blocked");
    expect(result.reasons).toContain("Team mismatch / stale roster assignment");
  });

  it("confirms a fully validated home player in the official lineup", () => {
    const result = validateHrCandidate(
      confirmedHomePlayer,
      game,
      "healthy",
      true,
      true,
      new Set<number>(),
    );

    expect(result.valid).toBe(true);
    expect(result.status).toBe("confirmed");
  });
});

describe("validateProjectedPreviewCandidate", () => {
  it("returns projected status with lineup warning, not confirmed", () => {
    const previewPlayer: TodayPlayer = {
      ...confirmedHomePlayer,
      lineupStatus: "projected",
      activeRosterStatus: true,
    };

    const result = validateProjectedPreviewCandidate(
      previewPlayer,
      game,
      "healthy",
      true,
      true,
      new Set<number>(),
    );

    expect(result.valid).toBe(true);
    expect(result.status).toBe("projected");
    expect(result.status).not.toBe("confirmed");
    expect(result.warnings.some((warning) => /lineup/i.test(warning))).toBe(true);
  });

  it("blocks projected preview when active roster team disagrees with game team", () => {
    const stalePreview: TodayPlayer = {
      ...confirmedHomePlayer,
      lineupStatus: "projected",
      activeRosterTeamId: 111,
    };

    const result = validateProjectedPreviewCandidate(
      stalePreview,
      game,
      "healthy",
      true,
      true,
      new Set<number>(),
    );

    expect(result.valid).toBe(false);
    expect(result.status).toBe("blocked");
    expect(result.reasons).toContain("Team mismatch / stale roster assignment");
  });
});
