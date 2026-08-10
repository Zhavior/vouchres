/**
 * HR outcome label contract (HR-M1, Batch 1).
 *
 * The label half of the snapshot/outcome pair. A row here says a batter came
 * to the plate in a completed game and either did or did not homer. Nothing
 * here estimates, prices, or recommends anything — it is recorded fact from a
 * final boxscore.
 *
 * Joins to hr_feature_snapshots on (game_pk, player_id).
 */

/** Free MLB Stats API. The only source this pipeline is allowed to use. */
export const OUTCOME_SOURCE = "mlb_statsapi";

export interface HrGameOutcomeRow {
  game_pk: string;
  player_id: string;
  /** Slate date the game belongs to (YYYY-MM-DD), not the UTC end time. */
  game_date: string;
  /** Always >= 1. Zero-PA players produce no row — see the migration comment. */
  plate_appearances: number;
  home_runs: number;
  hr_flag: boolean;
  /** Official starter spot 1-9; null for substitutes and pinch hitters. */
  batting_order: number | null;
  team_id: string;
  opponent_team_id: string;
  /** MLB detailedState at ingest time. */
  game_state: string;
  source: string;
}

/**
 * Why a game contributed no rows. Every one of these is reported with a count;
 * none of them is allowed to pass silently, because "0 rows written" and "0
 * rows because the feed was down" are very different facts.
 */
export type OutcomeSkipReason =
  /** Not played to completion yet — scheduled, live, postponed, or suspended. */
  | "not_final"
  /** The boxscore endpoint returned nothing usable. Retried on the next run. */
  | "boxscore_unavailable"
  /** Final boxscore with a missing team id. Never substituted with a placeholder. */
  | "missing_team_ids"
  /** Final game whose boxscore contained no batter with a plate appearance. */
  | "no_batters_with_pa";

/** Ingest-level skip, on top of the per-game build reasons above. */
export type OutcomeIngestSkipReason = OutcomeSkipReason | "already_ingested";
