/**
 * Boxscore -> outcome rows (HR-M1, Batch 1).
 *
 * Pure. No network, no database, no clock. The backfill script and the nightly
 * cron both call this exact function, so the two paths cannot drift into
 * producing different labels for the same game.
 *
 * The label definition is frozen in the migration comment; this file is its
 * only implementation.
 */

import { isMlbFinalStatusText } from "../mlb/gameStatus";
import { officialStartersFromBoxscoreTeam } from "../mlb/hrPipeline";
import {
  OUTCOME_SOURCE,
  type HrGameOutcomeRow,
  type OutcomeSkipReason,
} from "./outcomeTypes";

/**
 * Whether a game has been played to a completed, gradeable result.
 *
 * Delegates to the same predicate the grading pipeline uses, which is the
 * point: it already knows that MLB reports abstractGameState="Final" alongside
 * detailedState="Postponed", and that a suspended game only reports "Final"
 * once it has actually been resumed and completed. Re-deriving that here would
 * eventually disagree with grading, and a label set that disagrees with the
 * grader is worse than no label set.
 */
export function isIngestibleGameState(status: unknown): boolean {
  return isMlbFinalStatusText(status);
}

export interface BuildOutcomeRowsInput {
  gamePk: string;
  /** Slate date (YYYY-MM-DD) the game belongs to. */
  gameDate: string;
  /** MLB detailedState from the schedule feed. */
  gameState: string;
  /** Raw boxscore payload, exactly as getBoxscore returns it. */
  boxscore: unknown;
}

export interface BuildOutcomeRowsResult {
  rows: HrGameOutcomeRow[];
  /** Non-null when the game produced no rows, with the measured reason. */
  skipped: { reason: OutcomeSkipReason; detail: string } | null;
  /**
   * Roster entries with no plate appearance. These deliberately produce no
   * row; the count is surfaced so "we saw them and chose not to label them"
   * is distinguishable from "we never saw them".
   */
  noPlateAppearance: number;
  /**
   * Entries dropped because a required field was missing or non-numeric.
   * Reported rather than defaulted — a fabricated 0 home runs is a wrong
   * label, not a missing one.
   */
  malformed: string[];
}

interface BoxscoreTeam {
  team?: { id?: unknown };
  players?: Record<string, unknown>;
}

interface BoxscorePlayer {
  person?: { id?: unknown };
  stats?: { batting?: { plateAppearances?: unknown; homeRuns?: unknown } };
}

function teamId(team: BoxscoreTeam | undefined): string | null {
  const raw = team?.team?.id;
  if (raw === null || raw === undefined) return null;
  const text = String(raw).trim();
  return text.length > 0 ? text : null;
}

/** Strict: a stat that is not a finite non-negative integer is missing, not zero. */
function statCount(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return Math.trunc(value);
}

export function buildOutcomeRows(input: BuildOutcomeRowsInput): BuildOutcomeRowsResult {
  const empty = { rows: [], noPlateAppearance: 0, malformed: [] };

  if (!isIngestibleGameState(input.gameState)) {
    return {
      ...empty,
      skipped: { reason: "not_final", detail: `game_state=${input.gameState}` },
    };
  }

  const teams = (input.boxscore as { teams?: { home?: BoxscoreTeam; away?: BoxscoreTeam } } | null)
    ?.teams;
  if (!teams?.home || !teams?.away) {
    return {
      ...empty,
      skipped: { reason: "boxscore_unavailable", detail: "boxscore missing teams.home/teams.away" },
    };
  }

  const homeTeamId = teamId(teams.home);
  const awayTeamId = teamId(teams.away);
  // NOT NULL columns. A final boxscore without team identifiers is a feed
  // defect; labelling it against a placeholder team would poison every
  // opponent-conditioned feature downstream.
  if (!homeTeamId || !awayTeamId) {
    return {
      ...empty,
      skipped: {
        reason: "missing_team_ids",
        detail: `home=${homeTeamId ?? "null"} away=${awayTeamId ?? "null"}`,
      },
    };
  }

  const rows: HrGameOutcomeRow[] = [];
  const malformed: string[] = [];
  const seenPlayerIds = new Set<string>();
  let noPlateAppearance = 0;

  const sides: Array<{ side: BoxscoreTeam; teamId: string; opponentTeamId: string }> = [
    { side: teams.away, teamId: awayTeamId, opponentTeamId: homeTeamId },
    { side: teams.home, teamId: homeTeamId, opponentTeamId: awayTeamId },
  ];

  for (const { side, teamId: sideTeamId, opponentTeamId } of sides) {
    // Starters only, keyed by numeric player id. Substitutes intentionally
    // resolve to null rather than to their sub-slot code (101, 201, ...).
    const startingOrders = officialStartersFromBoxscoreTeam(side);

    // Iterated over `players` rather than `batters`, so a player who reached
    // the plate is labelled even if the feed left them out of the batters
    // array. Plate appearances, not roster membership, decide who gets a row.
    for (const [key, raw] of Object.entries(side.players ?? {})) {
      const player = raw as BoxscorePlayer;

      const personId = player?.person?.id;
      const playerId =
        personId === null || personId === undefined ? null : String(personId).trim() || null;

      const plateAppearances = statCount(player?.stats?.batting?.plateAppearances);

      // Did not bat. This is the overwhelming majority of skips: relief
      // pitchers, bench players, the whole inactive half of the roster.
      if (plateAppearances === null || plateAppearances < 1) {
        noPlateAppearance += 1;
        continue;
      }

      if (!playerId) {
        malformed.push(`${input.gamePk}:${key} has plate appearances but no person.id`);
        continue;
      }

      const homeRuns = statCount(player?.stats?.batting?.homeRuns);
      if (homeRuns === null) {
        // Never defaulted to 0. "We do not know" and "did not homer" are
        // different labels and only one of them is honest here.
        malformed.push(`${input.gamePk}:${playerId} has ${plateAppearances} PA but no home_runs`);
        continue;
      }

      // A player cannot appear twice in one game. Guarded anyway so a feed
      // anomaly surfaces as a report line instead of a primary-key conflict.
      if (seenPlayerIds.has(playerId)) {
        malformed.push(`${input.gamePk}:${playerId} appears more than once in the boxscore`);
        continue;
      }
      seenPlayerIds.add(playerId);

      rows.push({
        game_pk: input.gamePk,
        player_id: playerId,
        game_date: input.gameDate,
        plate_appearances: plateAppearances,
        home_runs: homeRuns,
        hr_flag: homeRuns >= 1,
        batting_order: startingOrders.get(Number(playerId)) ?? null,
        team_id: sideTeamId,
        opponent_team_id: opponentTeamId,
        game_state: input.gameState,
        source: OUTCOME_SOURCE,
      });
    }
  }

  if (rows.length === 0) {
    return {
      rows,
      skipped: {
        reason: "no_batters_with_pa",
        detail: `final game with 0 labelled batters (roster entries seen: ${noPlateAppearance}, malformed: ${malformed.length})`,
      },
      noPlateAppearance,
      malformed,
    };
  }

  return { rows, skipped: null, noPlateAppearance, malformed };
}
