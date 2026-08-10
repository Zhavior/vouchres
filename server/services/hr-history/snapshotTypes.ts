/**
 * HR feature snapshot contract (HR-M1).
 *
 * A snapshot records what the pipeline knew about a batter before first pitch.
 * It is written once and never revised — see the migration for why.
 *
 * Nothing here computes a probability, a price, or a recommendation. The
 * pipeline's own `hrScore` and `estimatedHrProbability` ride along inside the
 * payload as uncalibrated legacy values so that a future model can be compared
 * against them; they are not labels and must not be treated as truth.
 */

import type { LineupStatus } from "../mlb/hrValidation";

/**
 * Bump when the shape or meaning of the captured payload changes. Feeds the
 * feature hash, so a bump invalidates replay comparisons against older rows —
 * which is the point.
 */
export const FEATURE_SET_VERSION = "hr-snapshot-1";

/** Per-source fetch timestamps. Absent keys mean the source did not contribute. */
export interface SourceAsOf {
  schedule?: string;
  board?: string;
  [source: string]: string | undefined;
}

export interface HrFeatureSnapshotRow {
  slate_date: string;
  game_pk: string;
  player_id: string;
  capture_seq: number;

  team_id: string;
  opponent_team_id: string;
  home_team_id: string;
  away_team_id: string;

  captured_at: string;
  scheduled_first_pitch: string;
  board_generated_at: string | null;
  is_point_in_time: boolean;

  lineup_status: LineupStatus;
  batting_order: number | null;
  opposing_pitcher_id: string | null;
  venue: string | null;

  features: Record<string, unknown>;
  source_as_of: SourceAsOf;
  feature_hash: string;
  pipeline_version: string;
  feature_set_version: string;
}

/** Game-level context the board does not return; sourced from the schedule feed. */
export interface GameScheduleContext {
  gamePk: string;
  homeTeamId: string;
  awayTeamId: string;
  venue: string | null;
  scheduledFirstPitch: string;
}

/**
 * Training eligibility, recorded at capture time and enforced when a training
 * set is assembled. Rule 4 needs hr_game_outcomes, which does not exist yet.
 */
export const TRAINING_ELIGIBILITY_RULES = [
  "is_point_in_time = true",
  "lineup_status <> 'unknown'",
  "opposing_pitcher_id is not null",
  "a matching row exists in hr_game_outcomes",
] as const;

/** Rules 1-3 — the part checkable without the outcomes table. */
export function meetsSnapshotSideEligibility(row: HrFeatureSnapshotRow): boolean {
  return (
    row.is_point_in_time &&
    row.lineup_status !== "unknown" &&
    row.opposing_pitcher_id != null
  );
}
