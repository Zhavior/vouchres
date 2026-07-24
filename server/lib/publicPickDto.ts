/**
 * Public / follower-facing pick projections.
 * Never return ots_proof blobs or client_ref idempotency keys on list APIs.
 */

/** Columns safe for public/follower pick list responses. */
export const PUBLIC_PICK_COLUMNS = [
  "id",
  "user_id",
  "capper_id",
  "sport",
  "market",
  "selection",
  "odds",
  "odds_decimal",
  "stake_units",
  "status",
  "settled_units",
  "explanation",
  "source",
  "visibility",
  "leg_type",
  "event_id",
  "player_or_team",
  "game_name",
  "ai_confidence",
  "created_at",
  "updated_at",
  "locked_at",
  "graded_at",
  "proof_hash",
  "ots_stamped_at",
].join(", ");

const STRIP_KEYS = new Set([
  "ots_proof",
  "client_ref",
  "judge_verdict",
  "internal_notes",
  "grading_raw",
]);

/** Defense-in-depth: strip sensitive keys even if a select drifts. */
export function toPublicPickDto(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (STRIP_KEYS.has(key)) continue;
    out[key] = value;
  }
  out.has_ots_proof = Boolean(row.ots_proof) || Boolean(row.ots_stamped_at);
  return out;
}

export function toPublicPickDtos(rows: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return rows.map((row) => toPublicPickDto(row));
}
