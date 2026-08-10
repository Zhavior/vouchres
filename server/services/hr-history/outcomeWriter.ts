/**
 * Outcome row persistence (HR-M1, Batch 1).
 *
 * All database I/O for labels lives here so the builder stays pure and the two
 * entry points (backfill script, nightly cron) share one write path.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { HrGameOutcomeRow } from "./outcomeTypes";

export const OUTCOME_TABLE = "hr_game_outcomes";

/** Guards against a silently truncated resume lookup. ~30 games x ~26 batters. */
const GAME_PK_LOOKUP_LIMIT = 5000;

/**
 * game_pks on this date that already have labels.
 *
 * This is the whole resumability mechanism: a game with rows is done, a game
 * without rows has not been ingested yet. No cursor file, no run table,
 * nothing to get out of sync with the data itself.
 *
 * It is also why the nightly re-check works for free — a game that was still
 * in progress on the first pass wrote nothing, so it simply is not in this set
 * the next time around.
 */
export async function findIngestedGamePks(
  db: SupabaseClient,
  gameDate: string,
): Promise<Set<string>> {
  const { data, error } = await db
    .from(OUTCOME_TABLE)
    .select("game_pk")
    .eq("game_date", gameDate)
    .range(0, GAME_PK_LOOKUP_LIMIT - 1);

  if (error) throw new Error(`outcome ingest lookup failed: ${error.message}`);

  const rows = data ?? [];
  if (rows.length >= GAME_PK_LOOKUP_LIMIT) {
    // Under-reporting here is harmless (the insert ignores duplicates) but it
    // would quietly re-fetch boxscores forever, so it is announced.
    console.warn(
      `[hrOutcomes] ingest lookup for ${gameDate} hit the ${GAME_PK_LOOKUP_LIMIT}-row cap — ` +
        `already-ingested detection may be incomplete for this date`,
    );
  }

  return new Set(rows.map((row) => String(row.game_pk)));
}

/**
 * Insert one game's labels. Conflicts are ignored rather than raised, so a
 * re-run is a safe no-op and there is no UPDATE path on captured data.
 *
 * Returns the number of rows submitted, not the number the database accepted —
 * ON CONFLICT DO NOTHING does not report that, and inventing a number would be
 * worse than naming the limitation. Idempotency is verified by re-running and
 * checking the table's own count, which is what the verification gate does.
 */
export async function insertOutcomeRows(
  db: SupabaseClient,
  rows: HrGameOutcomeRow[],
): Promise<number> {
  if (rows.length === 0) return 0;

  const { error } = await db
    .from(OUTCOME_TABLE)
    .upsert(rows, { onConflict: "game_pk,player_id", ignoreDuplicates: true });

  if (error) throw new Error(`outcome insert failed: ${error.message}`);
  return rows.length;
}

/** Row count for one slate date — used to prove a re-run added nothing. */
export async function countOutcomeRows(
  db: SupabaseClient,
  gameDate: string,
): Promise<number> {
  const { count, error } = await db
    .from(OUTCOME_TABLE)
    .select("game_pk", { count: "exact", head: true })
    .eq("game_date", gameDate);

  if (error) throw new Error(`outcome count failed: ${error.message}`);
  return count ?? 0;
}
