import { todayISO } from "./mlbClient";
/**
 * HR Board Validation Engine — validateHrCandidate()
 *
 * 15 checks that must ALL pass before a player can be scored as an HR candidate.
 * Returns confirmed / projected / warning / incomplete / blocked.
 *
 * ZERO TOLERANCE for:
 * - Wrong team (player's team doesn't match today's game)
 * - Wrong game (player not on today's schedule)
 * - Injured list / scratched players
 * - Missing playerId, playerName, pitcher
 * - Placeholder/demo/mock values
 * - Duplicate players across games
 */

import {
  ValidationResult,
  GameContext,
  TodayPlayer,
  InjuryStatus,
  isPlaceholder,
} from "./hrValidation";
import {
  TEAM_MISMATCH_REASON,
  hasTeamAssignmentMismatch,
  teamAssignmentMismatchDetail,
} from "./teamAssignmentSafety";

/* ============ Main validation function ============ */

export function validateHrCandidate(
  player: TodayPlayer,
  game: GameContext,
  injuryStatus: InjuryStatus,
  hasHitterStats: boolean,
  hasPitcherStats: boolean,
  seenPlayerIds: Set<number>
): ValidationResult {
  return validateCandidateInternal(player, game, injuryStatus, hasHitterStats, hasPitcherStats, seenPlayerIds, true);
}

export function validateProjectedPreviewCandidate(
  player: TodayPlayer,
  game: GameContext,
  injuryStatus: InjuryStatus,
  hasHitterStats: boolean,
  hasPitcherStats: boolean,
  seenPlayerIds: Set<number>
): ValidationResult {
  return validateCandidateInternal(player, game, injuryStatus, hasHitterStats, hasPitcherStats, seenPlayerIds, false);
}

function validateCandidateInternal(
  player: TodayPlayer,
  game: GameContext,
  injuryStatus: InjuryStatus,
  hasHitterStats: boolean,
  hasPitcherStats: boolean,
  seenPlayerIds: Set<number>,
  requireConfirmedLineup: boolean
): ValidationResult {
  // CHECK 1: playerId exists
  if (!player.playerId || player.playerId <= 0) {
    return { valid: false, status: "blocked", reasons: ["Missing playerId"], warnings: [] };
  }

  // CHECK 2: playerName exists + not placeholder
  if (isPlaceholder(player.playerName)) {
    return { valid: false, status: "blocked", reasons: ["Missing or placeholder playerName"], warnings: [] };
  }

  // CHECK 3: player's teamId matches today's home OR away team
  const isHomeTeam = player.teamId === game.homeTeamId;
  const isAwayTeam = player.teamId === game.awayTeamId;
  const expectedTeamAbbrev = isHomeTeam ? game.homeTeamAbbrev : isAwayTeam ? game.awayTeamAbbrev : "";

  if (!isHomeTeam && !isAwayTeam) {
    return {
      valid: false,
      status: "blocked",
      reasons: [`Player teamId ${player.teamId} doesn't match game teams (${game.awayTeamId} vs ${game.homeTeamId})`],
      warnings: [],
    };
  }

  if (requireConfirmedLineup) {
    if (
      hasTeamAssignmentMismatch({
        teamId: player.teamId,
        sourceTeamId: player.sourceTeamId,
        activeRosterTeamId: player.activeRosterTeamId,
        playerCurrentTeamId: player.playerCurrentTeamId,
      })
      || (expectedTeamAbbrev && player.teamAbbrev !== expectedTeamAbbrev)
      || (player.sourceTeamAbbrev && player.teamAbbrev !== player.sourceTeamAbbrev)
    ) {
      return {
        valid: false,
        status: "blocked",
        reasons: [TEAM_MISMATCH_REASON],
        warnings: [
          teamAssignmentMismatchDetail({
            teamId: player.teamId,
            sourceTeamId: player.sourceTeamId,
            activeRosterTeamId: player.activeRosterTeamId,
            playerCurrentTeamId: player.playerCurrentTeamId,
          }) + `, teamAbbrev=${player.teamAbbrev}, expectedTeamAbbrev=${expectedTeamAbbrev || "unknown"}`,
        ],
      };
    }
  } else {
    if (
      hasTeamAssignmentMismatch({
        teamId: player.teamId,
        sourceTeamId: player.sourceTeamId ?? player.teamId,
        activeRosterTeamId: player.activeRosterTeamId,
        playerCurrentTeamId: player.playerCurrentTeamId,
      })
    ) {
      return {
        valid: false,
        status: "blocked",
        reasons: [TEAM_MISMATCH_REASON],
        warnings: [
          `Preview safety mismatch: ${teamAssignmentMismatchDetail({
            teamId: player.teamId,
            sourceTeamId: player.sourceTeamId ?? player.teamId,
            activeRosterTeamId: player.activeRosterTeamId,
            playerCurrentTeamId: player.playerCurrentTeamId,
          })}`,
        ],
      };
    }
  }

  // CHECK 4: opponentTeamId is the opposite team in the same game
  const expectedOpponent = isHomeTeam ? game.awayTeamId : game.homeTeamId;
  if (player.opponentTeamId !== expectedOpponent) {
    return {
      valid: false,
      status: "blocked",
      reasons: [`opponentTeamId ${player.opponentTeamId} doesn't match expected ${expectedOpponent}`],
      warnings: [],
    };
  }

  // CHECK 5: gamePk matches today's schedule
  if (player.gamePk !== game.gamePk) {
    return {
      valid: false,
      status: "blocked",
      reasons: [`gamePk ${player.gamePk} doesn't match game ${game.gamePk}`],
      warnings: [],
    };
  }

  // CHECK 6: gameDate matches today
  const today = todayISO();
  if (player.gameDate !== today && player.gameDate !== game.gameDate) {
    return {
      valid: false,
      status: "blocked",
      reasons: [`gameDate ${player.gameDate} doesn't match today ${today}`],
      warnings: [],
    };
  }

  // CHECK 7: player is on active roster or confirmed lineup
  if (!player.activeRosterStatus && player.lineupStatus !== "confirmed") {
    return {
      valid: false,
      status: "blocked",
      reasons: ["Player not on active roster and not in confirmed lineup"],
      warnings: [],
    };
  }

  // CHECK 7.5: roster-only projections are not safe enough for HR candidates.
  // MLB active/current roster payloads can be internally consistent while still
  // stale for betting research. Only official game batting order membership
  // proves the player belongs to this exact team/game.
  if (requireConfirmedLineup && player.lineupStatus !== "confirmed") {
    return {
      valid: false,
      status: "blocked",
      reasons: ["Official lineup not posted yet"],
      warnings: ["Player is not confirmed in the official batting order for this exact game/team."],
    };
  }

  // CHECK 8: player is NOT on injured list
  if (injuryStatus === "injured_list") {
    return {
      valid: false,
      status: "blocked",
      reasons: ["Player is on the injured list"],
      warnings: [],
    };
  }

  // CHECK 9: player is NOT scratched
  if (injuryStatus === "scratched") {
    return {
      valid: false,
      status: "blocked",
      reasons: ["Player is scratched from today's lineup"],
      warnings: [],
    };
  }

  // CHECK 10: opposing pitcher exists + not placeholder
  const pitcher = isHomeTeam ? game.probablePitchers.away : game.probablePitchers.home;
  if (!pitcher || !pitcher.pitcherId || isPlaceholder(pitcher.pitcherName)) {
    return {
      valid: false,
      status: "incomplete",
      reasons: ["Opposing pitcher not announced yet"],
      warnings: ["Cannot score without a known pitcher — mark as incomplete"],
    };
  }

  // CHECK 11: pitcher teamId matches the opponent team
  if (pitcher.teamId !== expectedOpponent) {
    return {
      valid: false,
      status: "blocked",
      reasons: [`Pitcher teamId ${pitcher.teamId} doesn't match opponent ${expectedOpponent}`],
      warnings: [],
    };
  }

  // CHECK 12: hitter has recent hitting data
  if (!hasHitterStats) {
    return {
      valid: false,
      status: "incomplete",
      reasons: ["No recent hitting stats available"],
      warnings: ["Cannot score without hitter data — mark as incomplete"],
    };
  }

  // CHECK 13: pitcher has recent pitching data
  if (!hasPitcherStats) {
    return {
      valid: false,
      status: "incomplete",
      reasons: ["No recent pitching stats available"],
      warnings: ["Cannot score without pitcher data — mark as incomplete"],
    };
  }

  // CHECK 14: no placeholder/mock/demo fields
  if (isPlaceholder(player.teamAbbrev) || isPlaceholder(player.battingHand)) {
    return {
      valid: false,
      status: "blocked",
      reasons: ["Placeholder values detected in player fields"],
      warnings: [],
    };
  }

  // CHECK 15: player is not duplicated across multiple games
  if (seenPlayerIds.has(player.playerId)) {
    return {
      valid: false,
      status: "blocked",
      reasons: [`Player ${player.playerId} already appears in another game — duplicate blocked`],
      warnings: [],
    };
  }

  // === All hard checks passed. Determine status ===
  const warnings: string[] = [];

  // Day-to-day → warning
  if (injuryStatus === "day_to_day") {
    return {
      valid: true,
      status: "warning",
      reasons: [],
      warnings: ["Player is day-to-day. Confidence reduced."],
    };
  }

  // Questionable + lineup not confirmed → incomplete
  if (injuryStatus === "questionable" && player.lineupStatus !== "confirmed") {
    return {
      valid: false,
      status: "incomplete",
      reasons: ["Player is questionable and lineup not confirmed"],
      warnings: ["Cannot verify player will play — mark as incomplete"],
    };
  }

  // Questionable + lineup confirmed → warning
  if (injuryStatus === "questionable") {
    return {
      valid: true,
      status: "warning",
      reasons: [],
      warnings: ["Player is questionable but in confirmed lineup. Confidence reduced."],
    };
  }

  // Unknown injury status → warning (don't pretend healthy)
  if (injuryStatus === "unknown") {
    warnings.push("Injury status unknown — confidence reduced.");
  }

  // Lineup not confirmed → projected
  if (player.lineupStatus !== "confirmed") {
    return {
      valid: true,
      status: "projected",
      reasons: [],
      warnings: ["Lineup not confirmed yet", ...warnings],
    };
  }

  // Everything confirmed
  return {
    valid: true,
    status: "confirmed",
    reasons: [],
    warnings,
  };
}
