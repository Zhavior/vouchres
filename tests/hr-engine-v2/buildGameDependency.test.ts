import { describe, expect, it } from "vitest";
import { buildGameDependency } from "../../server/services/mlb/hr-engine/v2/adapters/buildGameDependency";
import type {
  HrEligibleHitter,
  HrSlateGame,
} from "../../server/services/mlb/hr-engine/hrEngineTypes";

const game: HrSlateGame = {
  gamePk: 123,
  gameId: "123",
  date: "2026-08-10",
  gameDate: "2026-08-10T23:07:00Z",
  status: "Scheduled",
  venue: "Rogers Centre",
  awayTeamId: 147,
  awayTeam: "NYY",
  awayTeamName: "New York Yankees",
  homeTeamId: 141,
  homeTeam: "TOR",
  homeTeamName: "Toronto Blue Jays",
};

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

const options = {
  roofStatus: "closed" as const,
  gameTimeLocal: "19:07",
  impliedTeamTotals: { away: 4.8, home: 4.2 },
};

describe("buildGameDependency", () => {
  it("uses scheduled-game sides for an away hitter", () => {
    const result = buildGameDependency(hitter, game, options);

    expect(result.ok).toBe(true);

    if (!result.ok) return;

    expect(result.game.awayTeam).toBe("NYY");
    expect(result.game.homeTeam).toBe("TOR");
    expect(result.opponentTeam).toBe("TOR");
  });

  it("uses scheduled-game sides for a home hitter", () => {
    const result = buildGameDependency(
      {
        ...hitter,
        teamId: 141,
        team: "TOR",
        opponentTeamId: 147,
        opponent: "NYY",
      },
      game,
      options,
    );

    expect(result.ok).toBe(true);

    if (!result.ok) return;

    expect(result.opponentTeam).toBe("NYY");
  });

  it("rejects a hitter whose team is not in the scheduled game", () => {
    const result = buildGameDependency(
      {
        ...hitter,
        teamId: 119,
        team: "LAD",
      },
      game,
      options,
    );

    expect(result).toEqual({
      ok: false,
      reason: "HITTER_TEAM_NOT_IN_GAME",
      warnings: [],
    });
  });

  it("rejects a hitter linked to the wrong game", () => {
    const result = buildGameDependency(
      {
        ...hitter,
        gamePk: 999,
      },
      game,
      options,
    );

    expect(result).toEqual({
      ok: false,
      reason: "HITTER_GAME_MISMATCH",
      warnings: [],
    });
  });

  it("warns but derives the correct opponent when legacy opponent text is stale", () => {
    const result = buildGameDependency(
      {
        ...hitter,
        opponent: "BOS",
      },
      game,
      options,
    );

    expect(result.ok).toBe(true);

    if (!result.ok) return;

    expect(result.opponentTeam).toBe("TOR");
    expect(result.warnings.join(" ")).toMatch(/Legacy opponent mismatch/i);
  });
});
