import type { HrEligibleHitter, HrSlateGame } from "../../hrEngineTypes";
import type { DraftRequestDependencies } from "./buildDraftRequest";

export type GameDependencyOptions = {
  roofStatus: DraftRequestDependencies["game"]["roofStatus"];
  gameTimeLocal: string;
  impliedTeamTotals: { away: number; home: number };
};

export type GameDependencyResult =
  | {
      ok: true;
      game: DraftRequestDependencies["game"];
      opponentTeam: string;
      warnings: string[];
    }
  | {
      ok: false;
      reason: string;
      warnings: string[];
    };

export function buildGameDependency(
  hitter: HrEligibleHitter,
  game: HrSlateGame,
  options: GameDependencyOptions,
): GameDependencyResult {
  const warnings: string[] = [];

  if (!hitter.playerId || !hitter.teamId || !hitter.team?.trim()) {
    return {
      ok: false,
      reason: "HITTER_TEAM_IDENTITY_MISSING",
      warnings,
    };
  }

  if (hitter.gamePk !== game.gamePk || hitter.gameId !== game.gameId) {
    return {
      ok: false,
      reason: "HITTER_GAME_MISMATCH",
      warnings,
    };
  }

  const hitterIsAway = hitter.teamId === game.awayTeamId;
  const hitterIsHome = hitter.teamId === game.homeTeamId;

  if (!hitterIsAway && !hitterIsHome) {
    return {
      ok: false,
      reason: "HITTER_TEAM_NOT_IN_GAME",
      warnings,
    };
  }

  const expectedOpponent = hitterIsAway ? game.homeTeam : game.awayTeam;

  if (hitter.opponent !== expectedOpponent) {
    warnings.push(
      `Legacy opponent mismatch: expected ${expectedOpponent}, received ${hitter.opponent}.`,
    );
  }

  return {
    ok: true,
    game: {
      date: game.date,
      awayTeam: game.awayTeam,
      homeTeam: game.homeTeam,
      roofStatus: options.roofStatus,
      gameTimeLocal: options.gameTimeLocal,
      impliedTeamTotals: options.impliedTeamTotals,
    },
    opponentTeam: expectedOpponent,
    warnings,
  };
}
