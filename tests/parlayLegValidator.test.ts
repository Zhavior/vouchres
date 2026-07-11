import { describe, expect, it } from "vitest";
import {
  assessPlayerTeamSafety,
  TEAM_MISMATCH_REASON,
  validateParlayLegCandidate,
} from "../src/lib/parlays/parlayLegValidator";

describe("parlayLegValidator", () => {
  it("blocks legs missing playerId", () => {
    const result = validateParlayLegCandidate({
      leg: {
        gamePk: "777001",
        marketCode: "ANYTIME_HR",
        statTarget: 1,
        comparator: ">=",
        eventKey: "MLB_777001_660271_ANYTIME_HR_1_GTE",
      },
    });
    expect(result.valid).toBe(false);
    expect(result.blockedReason).toMatch(/playerId/i);
  });

  it("blocks legs with placeholder event keys", () => {
    const result = validateParlayLegCandidate({
      leg: {
        playerId: "660271",
        gamePk: "777001",
        marketCode: "ANYTIME_HR",
        statTarget: 1,
        comparator: ">=",
        eventKey: "MLB_GAME_TBD_660271_ANYTIME_HR_1_GTE",
      },
    });
    expect(result.valid).toBe(false);
    expect(result.blockedReason).toMatch(/placeholder/i);
  });

  it("blocks team mismatch when roster team differs from slate team", () => {
    const result = assessPlayerTeamSafety(
      {
        id: "660271",
        name: "Aaron Judge",
        team: "NYY",
        teamId: 147,
        sourceTeamId: 111,
        position: "RF",
        number: "99",
        headshot: "",
        injuryStatus: "",
        injurySeverity: "NONE",
        injuryNotes: "",
        batterScore: 0,
        seasonStats: { avg: "0", hr: "0", rbi: "0", ops: "0" },
        gameLogs: [],
        propositions: [],
        bats: "R",
        throws: "R",
        height: "",
        weight: "",
        birthdate: "",
        advanced: {} as any,
        splits: {} as any,
        scoutingReport: {} as any,
      },
      {
        homeTeam: "NYY",
        awayTeam: "BOS",
        status: "Scheduled",
        gamePk: "777001",
        homeTeamId: 147,
        awayTeamId: 111,
      },
    );
    expect(result.valid).toBe(false);
    expect(result.blockedReason).toBe(TEAM_MISMATCH_REASON);
  });

  it("accepts complete identity legs", () => {
    const result = validateParlayLegCandidate({
      leg: {
        playerId: "660271",
        gamePk: "777001",
        marketCode: "ANYTIME_HR",
        statTarget: 1,
        comparator: ">=",
        eventKey: "MLB_777001_660271_ANYTIME_HR_1_GTE",
      },
      player: {
        id: "660271",
        name: "Aaron Judge",
        team: "NYY",
        teamId: 147,
        sourceTeamId: 147,
        position: "RF",
        number: "99",
        headshot: "",
        injuryStatus: "",
        injurySeverity: "NONE",
        injuryNotes: "",
        batterScore: 0,
        seasonStats: { avg: "0", hr: "0", rbi: "0", ops: "0" },
        gameLogs: [],
        propositions: [],
        bats: "R",
        throws: "R",
        height: "",
        weight: "",
        birthdate: "",
        advanced: {} as any,
        splits: {} as any,
        scoutingReport: {} as any,
      },
      liveGames: [{
        homeTeam: "NYY",
        awayTeam: "BOS",
        status: "Scheduled",
        id: "777001",
        homeTeamId: 147,
        awayTeamId: 111,
      }],
    });
    expect(result.valid).toBe(true);
  });
});
