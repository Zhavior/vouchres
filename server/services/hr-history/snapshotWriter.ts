/**
 * Snapshot row construction + insert (HR-M1).
 *
 * Row building is pure and separated from the insert so the cron can build,
 * print, and count rows in --dry-run without touching the database.
 *
 * The board does not carry game-level context (home/away teams, venue, first
 * pitch), so that arrives separately from the schedule feed. This keeps
 * hrPipeline.ts untouched.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScoredHrCandidate } from "../mlb/hrValidation";
import { featureHash } from "./featureHash";
import { isPointInTime } from "./captureWindow";
import {
  FEATURE_SET_VERSION,
  type GameScheduleContext,
  type HrFeatureSnapshotRow,
  type SourceAsOf,
} from "./snapshotTypes";

export const SNAPSHOT_TABLE = "hr_feature_snapshots";

/** Only capture_seq 1 is written today; the column exists for future use. */
const CAPTURE_SEQ = 1;

export interface BuildRowsInput {
  slateDate: string;
  candidates: ScoredHrCandidate[];
  gameContexts: Map<string, GameScheduleContext>;
  /**
   * playerId -> batting order, from the pool. The scored candidate does not
   * carry the order, and it is the basis of expected plate appearances later,
   * so it is promoted rather than left null.
   */
  battingOrders: Map<string, number>;
  capturedAt: Date;
  boardGeneratedAt: string | null;
  pipelineVersion: string;
  sourceAsOf: SourceAsOf;
}

/**
 * The captured payload. Deliberately the whole candidate rather than a
 * hand-picked subset: HR-M3 is about to reshape these components, and a
 * snapshot that only kept today's fields would be worthless the moment that
 * lands. `features` is the record of what the pipeline said, verbatim.
 */
function featurePayload(candidate: ScoredHrCandidate): Record<string, unknown> {
  return { ...candidate } as unknown as Record<string, unknown>;
}

function toStringId(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

/**
 * Build rows for one slate. Candidates whose game has no schedule context are
 * dropped — without a scheduled first pitch there is no way to establish
 * point-in-time integrity, and a snapshot we cannot vouch for is worse than
 * none. Dropped candidates are returned so the caller can report them.
 */
export function buildSnapshotRows(input: BuildRowsInput): {
  rows: HrFeatureSnapshotRow[];
  skippedNoGameContext: number;
} {
  const rows: HrFeatureSnapshotRow[] = [];
  let skippedNoGameContext = 0;

  for (const candidate of input.candidates) {
    const gamePk = toStringId(candidate.gamePk);
    const playerId = toStringId(candidate.playerId);
    if (!gamePk || !playerId) {
      skippedNoGameContext += 1;
      continue;
    }

    const game = input.gameContexts.get(gamePk);
    if (!game) {
      skippedNoGameContext += 1;
      continue;
    }

    const teamId = toStringId(candidate.teamId);
    const opponentTeamId = toStringId(candidate.opponentTeamId);
    // Team identifiers are NOT NULL in the schema. A candidate missing one is a
    // pipeline defect, not something to paper over with a placeholder.
    if (!teamId || !opponentTeamId) {
      skippedNoGameContext += 1;
      continue;
    }

    const features = featurePayload(candidate);

    rows.push({
      slate_date: input.slateDate,
      game_pk: gamePk,
      player_id: playerId,
      capture_seq: CAPTURE_SEQ,

      team_id: teamId,
      opponent_team_id: opponentTeamId,
      home_team_id: game.homeTeamId,
      away_team_id: game.awayTeamId,

      captured_at: input.capturedAt.toISOString(),
      scheduled_first_pitch: game.scheduledFirstPitch,
      board_generated_at: input.boardGeneratedAt,
      // Computed here, never accepted from a caller.
      is_point_in_time: isPointInTime(
        input.capturedAt,
        new Date(game.scheduledFirstPitch),
      ),

      lineup_status: candidate.lineupStatus,
      batting_order: input.battingOrders.get(playerId) ?? null,
      opposing_pitcher_id: toStringId(candidate.opponentPitcherId),
      venue: game.venue,

      features,
      source_as_of: input.sourceAsOf,
      feature_hash: featureHash(features, {
        featureSetVersion: FEATURE_SET_VERSION,
        pipelineVersion: input.pipelineVersion,
      }),
      pipeline_version: input.pipelineVersion,
      feature_set_version: FEATURE_SET_VERSION,
    });
  }

  return { rows, skippedNoGameContext };
}

/** game_pks on this slate that already have a capture_seq 1 row. */
export async function findCapturedGamePks(
  db: SupabaseClient,
  slateDate: string,
): Promise<Set<string>> {
  const { data, error } = await db
    .from(SNAPSHOT_TABLE)
    .select("game_pk")
    .eq("slate_date", slateDate)
    .eq("capture_seq", CAPTURE_SEQ);

  if (error) throw new Error(`snapshot capture lookup failed: ${error.message}`);
  return new Set((data ?? []).map((row) => String(row.game_pk)));
}

/**
 * Insert one game's rows. Conflicts are ignored rather than raised, so a
 * re-run is a safe no-op. Each game is its own statement: a crash mid-slate
 * leaves earlier games captured rather than rolling the slate back.
 */
export async function insertSnapshotRows(
  db: SupabaseClient,
  rows: HrFeatureSnapshotRow[],
): Promise<number> {
  if (rows.length === 0) return 0;

  const { error } = await db
    .from(SNAPSHOT_TABLE)
    .upsert(rows, {
      onConflict: "game_pk,player_id,capture_seq",
      ignoreDuplicates: true,
    });

  if (error) throw new Error(`snapshot insert failed: ${error.message}`);
  return rows.length;
}
