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

/* ============ Main validation function ============ */

export function validateHrCandidate(
  player: TodayPlayer,
  game: GameContext,
  injuryStatus: InjuryStatus,
  hasHitterStats: boolean,
  hasPitcherStats: boolean,
  seenPlayerIds: Set<number>
): ValidationResult {

  const reasons: string[] = [];
  const warnings: string[] = [];

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
  if (!isHomeTeam && !isAwayTeam) {
    return {
      valid: false,
      status: "blocked",
      reasons: [`Player teamId ${player.teamId} doesn't match game teams (${game.awayTeamId} vs ${game.homeTeamId})`],
      warnings: [],
    };
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
  const today = new Date().toISOString().slice(0, 10);
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
