import { normalizePlayerId } from "../mlbHeadshot";
import { isClientLegIdentityComplete } from "../parlayIdentity";
import type { Leg, MLBPlayer } from "../../types";

export const TEAM_MISMATCH_REASON = "Team mismatch / stale roster assignment";

export type LiveGameRef = {
  homeTeam: string;
  awayTeam: string;
  status: string;
  gamePk?: string | number;
  id?: string | number;
  homeTeamId?: number | string | null;
  awayTeamId?: number | string | null;
};

export type PlayerTeamFields = MLBPlayer & {
  teamId?: number | string | null;
  sourceTeamId?: number | string | null;
  activeRosterTeamId?: number | string | null;
  playerCurrentTeamId?: number | string | null;
  teamAbbrev?: string | null;
  sourceTeamAbbrev?: string | null;
  resolvedGamePk?: string;
};

export interface ParlayLegValidation {
  valid: boolean;
  blockedReason?: string;
  warnings: string[];
}

function normalizeTeamName(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export function resolveLiveGamePk(game?: LiveGameRef | null): string | undefined {
  if (!game) return undefined;
  const pk = game.gamePk ?? game.id;
  return pk != null && String(pk).trim() !== "" ? String(pk) : undefined;
}

export function findPlayerLiveGame(
  player: Pick<MLBPlayer, "team">,
  liveGames: LiveGameRef[],
): LiveGameRef | undefined {
  const playerTeam = normalizeTeamName(player.team);
  if (!playerTeam) return undefined;
  return liveGames.find((game) => {
    const home = normalizeTeamName(game.homeTeam);
    const away = normalizeTeamName(game.awayTeam);
    return home === playerTeam || away === playerTeam;
  });
}

function hasPlaceholderToken(value: unknown): boolean {
  const raw = String(value ?? "").toUpperCase();
  return raw.includes("TBD") || raw === "0" || raw === "PLAYER" || raw === "GAME";
}

export function assessPlayerTeamSafety(
  player: PlayerTeamFields,
  matchedGame?: LiveGameRef | null,
): ParlayLegValidation {
  const warnings: string[] = [];
  const teamId = player.teamId != null ? Number(player.teamId) : null;
  const sourceTeamId = player.sourceTeamId != null ? Number(player.sourceTeamId) : null;
  const activeRosterTeamId = player.activeRosterTeamId != null ? Number(player.activeRosterTeamId) : null;
  const currentTeamId = player.playerCurrentTeamId != null ? Number(player.playerCurrentTeamId) : null;

  if (matchedGame) {
    const homeId = matchedGame.homeTeamId != null ? Number(matchedGame.homeTeamId) : null;
    const awayId = matchedGame.awayTeamId != null ? Number(matchedGame.awayTeamId) : null;
    if (teamId != null && Number.isFinite(teamId) && homeId != null && awayId != null) {
      if (teamId !== homeId && teamId !== awayId) {
        return {
          valid: false,
          blockedReason: TEAM_MISMATCH_REASON,
          warnings: [`player.teamId=${teamId} not in game ${awayId}@${homeId}`],
        };
      }
    }

    const playerTeam = normalizeTeamName(player.team);
    const home = normalizeTeamName(matchedGame.homeTeam);
    const away = normalizeTeamName(matchedGame.awayTeam);
    if (playerTeam && playerTeam !== home && playerTeam !== away) {
      return {
        valid: false,
        blockedReason: TEAM_MISMATCH_REASON,
        warnings: [`player.team=${player.team} not in ${matchedGame.awayTeam} @ ${matchedGame.homeTeam}`],
      };
    }
  }

  if (
    sourceTeamId != null &&
    teamId != null &&
    Number.isFinite(sourceTeamId) &&
    Number.isFinite(teamId) &&
    sourceTeamId !== teamId
  ) {
    return { valid: false, blockedReason: TEAM_MISMATCH_REASON, warnings: ["sourceTeamId !== teamId"] };
  }

  if (
    activeRosterTeamId != null &&
    teamId != null &&
    Number.isFinite(activeRosterTeamId) &&
    Number.isFinite(teamId) &&
    activeRosterTeamId !== teamId
  ) {
    return { valid: false, blockedReason: TEAM_MISMATCH_REASON, warnings: ["activeRosterTeamId !== teamId"] };
  }

  if (
    currentTeamId != null &&
    sourceTeamId != null &&
    Number.isFinite(currentTeamId) &&
    Number.isFinite(sourceTeamId) &&
    currentTeamId !== sourceTeamId
  ) {
    return { valid: false, blockedReason: TEAM_MISMATCH_REASON, warnings: ["playerCurrentTeamId !== sourceTeamId"] };
  }

  if (
    player.teamAbbrev &&
    player.sourceTeamAbbrev &&
    player.teamAbbrev !== player.sourceTeamAbbrev
  ) {
    return { valid: false, blockedReason: TEAM_MISMATCH_REASON, warnings: ["teamAbbrev !== sourceTeamAbbrev"] };
  }

  return { valid: true, warnings };
}

export function validateParlayLegCandidate(input: {
  leg: Partial<Leg> & Record<string, unknown>;
  player?: PlayerTeamFields;
  liveGames?: LiveGameRef[];
}): ParlayLegValidation {
  const warnings: string[] = [];
  const leg = input.leg;
  const playerId = normalizePlayerId(leg.playerId ?? leg.mlbPlayerId ?? input.player?.id);
  const gamePkRaw = leg.gamePk ?? leg.gameId;
  const gamePk = gamePkRaw != null && String(gamePkRaw).trim() !== "" ? String(gamePkRaw) : undefined;

  if (!playerId || hasPlaceholderToken(playerId)) {
    return {
      valid: false,
      blockedReason: "Missing official playerId — open this player from Research with confirmed IDs.",
      warnings,
    };
  }

  if (!gamePk || hasPlaceholderToken(gamePk)) {
    return {
      valid: false,
      blockedReason: "Missing gamePk — player's game is not on today's slate or lineup is unavailable.",
      warnings,
    };
  }

  const identityLeg = {
    ...leg,
    playerId,
    gamePk,
    marketCode: leg.marketCode ?? leg.market,
    statTarget: leg.statTarget ?? leg.threshold,
    comparator: leg.comparator ?? ">=",
  };

  if (!isClientLegIdentityComplete(identityLeg, 0)) {
    return {
      valid: false,
      blockedReason: "Incomplete grading identity — market, target, or comparator missing.",
      warnings,
    };
  }

  const eventKey = String(leg.eventKey ?? "");
  if (eventKey && (eventKey.includes("_TBD") || eventKey.includes("PLAYER_TBD") || eventKey.includes("GAME_TBD"))) {
    return {
      valid: false,
      blockedReason: "Event key still has placeholder identity — leg cannot be graded honestly.",
      warnings,
    };
  }

  if (input.player && input.liveGames) {
    const teamCheck = assessPlayerTeamSafety(input.player, findPlayerLiveGame(input.player, input.liveGames));
    if (!teamCheck.valid) return teamCheck;
    warnings.push(...teamCheck.warnings);
  }

  return { valid: true, warnings };
}

export function validateParlayLegBatch(
  legs: Array<Partial<Leg> | Leg | Record<string, unknown>>,
  player?: PlayerTeamFields,
  liveGames?: LiveGameRef[],
): ParlayLegValidation {
  for (const leg of legs) {
    const result = validateParlayLegCandidate({
      leg: leg as Partial<Leg> & Record<string, unknown>,
      player,
      liveGames,
    });
    if (!result.valid) return result;
  }
  return { valid: true, warnings: [] };
}
