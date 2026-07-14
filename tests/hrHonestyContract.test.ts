import { describe, expect, it } from "vitest";
import { buildHrBoardApiPayload } from "../server/services/mlb/hrBoardResponse";
import { applyTrustGate } from "../server/services/mlb/hr-engine/applyTrustGate";
import type { HrCandidate } from "../server/services/mlb/hr-engine/hrEngineTypes";
import { TEAM_MISMATCH_REASON, hasTeamAssignmentMismatch } from "../server/services/mlb/teamAssignmentSafety";
import {
  validateHrCandidate,
  validateProjectedPreviewCandidate,
} from "../server/services/mlb/hrValidator";
import type { GameContext, TodayPlayer } from "../server/services/mlb/hrValidation";

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

function sampleCandidate(overrides: Partial<HrCandidate> = {}): HrCandidate {
  return {
    playerId: 1,
    playerName: "Test Hitter",
    team: "NYY",
    teamId: 147,
    sourceTeamId: 147,
    activeRosterTeamId: 147,
    currentTeamId: 147,
    opponent: "BOS",
    opponentTeam: "BOS",
    opponentTeamId: 111,
    gamePk: 1,
    gameId: "g1",
    venue: "Yankee Stadium",
    opponentPitcherName: "Some Starter",
    opponentPitcherId: 99,
    lineupStatus: "projected_unconfirmed",
    dataQuality: "projection_preview",
    dataConfidence: 70,
    hrScore: 60,
    riskTier: "Playable",
    scoreBreakdown: {
      hitterPower: 50,
      pitcherVulnerability: 50,
      parkFactor: 100,
      recentForm: 50,
      lineupConfidence: 40,
      riskPenalty: 0,
      finalScore: 60,
    },
    reasons: [],
    warnings: ["Official lineup not posted yet. Do not treat as confirmed."],
    status: "preview",
    ...overrides,
  };
}

describe("HR honesty contract — confirmed vs projected vs mismatch", () => {
  it("keeps mismatch out of candidates[] and tags projected rows with lineup warning", () => {
    const payload = buildHrBoardApiPayload({
      candidates: [
        {
          playerId: 1,
          playerName: "Confirmed",
          team: "NYY",
          lineupStatus: "confirmed",
          hrScore: 90,
        },
        {
          playerId: 2,
          playerName: "Stale",
          team: "BAL",
          lineupStatus: "confirmed",
          hrScore: 88,
          warnings: [TEAM_MISMATCH_REASON],
          reasons: [TEAM_MISMATCH_REASON],
        },
        {
          playerId: 3,
          playerName: "SneakyProjected",
          team: "BOS",
          lineupStatus: "projected_unconfirmed",
          hrScore: 85,
        },
      ],
      projectedCandidates: [
        {
          playerId: 4,
          playerName: "Preview",
          team: "BOS",
          lineupStatus: "projected_unconfirmed",
          hrScore: 70,
        },
      ],
    });

    expect(payload.candidates).toHaveLength(1);
    expect(payload.candidates[0].playerName).toBe("Confirmed");
    expect(payload.confirmedCandidates).toHaveLength(1);
    expect(payload.projectedCandidates.every((row) =>
      (row.warnings ?? []).some((w: string) => w.includes("Official lineup not posted yet")),
    )).toBe(true);
    expect(payload.candidates.every((row) => !isProjected(row))).toBe(true);
  });

  it("blocks confirmed path on team ID mismatch with canonical reason", () => {
    const mismatched = {
      ...confirmedHomePlayer,
      sourceTeamId: 111,
      sourceTeamAbbrev: "NYY",
    };
    const result = validateHrCandidate(mismatched, game, "healthy", true, true, new Set());
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain(TEAM_MISMATCH_REASON);
  });

  it("never marks projected preview as confirmed", () => {
    const preview = {
      ...confirmedHomePlayer,
      lineupStatus: "projected" as const,
    };
    const result = validateProjectedPreviewCandidate(preview, game, "healthy", true, true, new Set());
    expect(result.status).not.toBe("confirmed");
    expect(result.reasons.join(" ") + " " + result.warnings.join(" ")).toMatch(/lineup/i);
  });

  it("applyTrustGate blocks structured team mismatch instead of name handlist", () => {
    expect(hasTeamAssignmentMismatch({
      teamId: 147,
      sourceTeamId: 147,
      activeRosterTeamId: 147,
      currentTeamId: 121,
    })).toBe(true);

    const gate = applyTrustGate([
      sampleCandidate({ currentTeamId: 121 }),
      sampleCandidate({ playerId: 2, playerName: "Ok", currentTeamId: 147 }),
    ]);

    expect(gate.debug.trueTeamMismatchBlocked).toBe(1);
    expect(gate.accepted).toHaveLength(1);
    expect(gate.accepted[0].playerName).toBe("Ok");
    expect(gate.debug.badPairingAuditBlocked[0]).toContain("currentTeamId=121");
    expect(gate.debug.teamMismatchReason).toBe(TEAM_MISMATCH_REASON);
  });
});

function isProjected(row: { lineupStatus?: string; dataQuality?: string }): boolean {
  const lineup = String(row.lineupStatus ?? "").toLowerCase();
  const quality = String(row.dataQuality ?? "").toLowerCase();
  return lineup.includes("project") || quality.includes("projection") || quality.includes("preview");
}
