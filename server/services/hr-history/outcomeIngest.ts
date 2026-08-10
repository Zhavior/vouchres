/**
 * Per-date outcome ingest (HR-M1, Batch 1).
 *
 * Schedule -> filter to completed games -> boxscore -> buildOutcomeRows -> insert.
 *
 * Both entry points call this: scripts/backfillHrOutcomes.ts loops it over a
 * date range, server/cron/hrOutcomeIngest.ts calls it for the last two slates.
 * Neither of them contains transform logic, so a fix here fixes both.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getBoxscore, getScheduleByDate } from "../mlb/mlbClient";
import { buildOutcomeRows, isIngestibleGameState } from "./outcomeBuilder";
import { findIngestedGamePks, insertOutcomeRows } from "./outcomeWriter";
import type { HrGameOutcomeRow, OutcomeIngestSkipReason } from "./outcomeTypes";

/** Sequential, with a pause between boxscores. The feed is free; do not abuse it. */
export const DEFAULT_REQUEST_DELAY_MS = 250;

export interface IngestDateOptions {
  /** Slate date, YYYY-MM-DD. */
  date: string;
  dryRun: boolean;
  /** Required unless dryRun. A dry run never touches the database. */
  db: SupabaseClient | null;
  requestDelayMs?: number;
  /** Log prefix, so the backfill and the cron are distinguishable in logs. */
  label?: string;
}

export interface IngestGameReport {
  gamePk: string;
  gameState: string;
  rows: number;
  skipReason: OutcomeIngestSkipReason | null;
  skipDetail: string | null;
}

export interface IngestDateReport {
  date: string;
  scheduledGames: number;
  /** Games that reached the boxscore stage. */
  gamesProcessed: number;
  rowsBuilt: number;
  rowsWritten: number;
  /** Batter-games with a home run, among the rows built this run. */
  hrRows: number;
  skipCounts: Record<string, number>;
  noPlateAppearance: number;
  malformed: string[];
  games: IngestGameReport[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function bump(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

export async function ingestOutcomesForDate(
  options: IngestDateOptions,
): Promise<IngestDateReport> {
  const { date, dryRun, db } = options;
  const label = options.label ?? "[hrOutcomes]";
  const delayMs = options.requestDelayMs ?? DEFAULT_REQUEST_DELAY_MS;

  if (!dryRun && !db) {
    throw new Error("ingestOutcomesForDate: a writing run requires a Supabase client");
  }

  const report: IngestDateReport = {
    date,
    scheduledGames: 0,
    gamesProcessed: 0,
    rowsBuilt: 0,
    rowsWritten: 0,
    hrRows: 0,
    skipCounts: {},
    noPlateAppearance: 0,
    malformed: [],
    games: [],
  };

  // Throws on upstream failure rather than returning an empty slate, so a feed
  // outage can never be recorded as "no games that day".
  const games = await getScheduleByDate(date);
  report.scheduledGames = games.length;

  if (games.length === 0) {
    console.log(`${label} ${date}: no games on the schedule`);
    return report;
  }

  // Resume point. In a dry run nothing is known to be ingested, which is
  // correct: a dry run reports what a fresh run would build.
  const alreadyIngested = dryRun ? new Set<string>() : await findIngestedGamePks(db!, date);

  let first = true;
  for (const game of games) {
    const gamePk = game.gamePk != null ? String(game.gamePk) : null;
    if (!gamePk) {
      bump(report.skipCounts, "missing_game_pk");
      continue;
    }

    const gameState = game.status ?? "unknown";

    if (alreadyIngested.has(gamePk)) {
      bump(report.skipCounts, "already_ingested");
      report.games.push({
        gamePk,
        gameState,
        rows: 0,
        skipReason: "already_ingested",
        skipDetail: null,
      });
      continue;
    }

    // Checked before fetching, so an unfinished slate costs one schedule call
    // instead of one boxscore call per game.
    if (!isIngestibleGameState(gameState)) {
      bump(report.skipCounts, "not_final");
      report.games.push({
        gamePk,
        gameState,
        rows: 0,
        skipReason: "not_final",
        skipDetail: `game_state=${gameState}`,
      });
      continue;
    }

    if (!first && delayMs > 0) await sleep(delayMs);
    first = false;

    // getBoxscore swallows its own failures and returns null; the builder turns
    // that into boxscore_unavailable, which a later run retries.
    const boxscore = await getBoxscore(Number(gamePk));
    report.gamesProcessed += 1;

    const built = buildOutcomeRows({ gamePk, gameDate: date, gameState, boxscore });
    report.noPlateAppearance += built.noPlateAppearance;
    report.malformed.push(...built.malformed);

    if (built.skipped) {
      bump(report.skipCounts, built.skipped.reason);
      report.games.push({
        gamePk,
        gameState,
        rows: 0,
        skipReason: built.skipped.reason,
        skipDetail: built.skipped.detail,
      });
      continue;
    }

    report.rowsBuilt += built.rows.length;
    report.hrRows += built.rows.filter((row) => row.hr_flag).length;

    let written = 0;
    if (!dryRun) {
      // Per game, so a crash mid-slate leaves earlier games ingested and the
      // resume lookup picks up exactly where it stopped.
      try {
        written = await insertOutcomeRows(db!, built.rows as HrGameOutcomeRow[]);
        report.rowsWritten += written;
      } catch (error) {
        bump(report.skipCounts, "insert_failed");
        console.error(
          `${label} ${date} game=${gamePk} insert failed:`,
          error instanceof Error ? error.message : String(error),
        );
        report.games.push({
          gamePk,
          gameState,
          rows: 0,
          skipReason: null,
          skipDetail: `insert failed: ${error instanceof Error ? error.message : String(error)}`,
        });
        continue;
      }
    }

    report.games.push({ gamePk, gameState, rows: built.rows.length, skipReason: null, skipDetail: null });
  }

  return report;
}

/** One-line per-date summary shared by both entry points. */
export function formatDateReport(report: IngestDateReport, dryRun: boolean): string {
  const skips = Object.keys(report.skipCounts).length
    ? JSON.stringify(report.skipCounts)
    : "{}";
  return (
    `${report.date}: scheduled=${report.scheduledGames} processed=${report.gamesProcessed} ` +
    `rows_built=${report.rowsBuilt} rows_${dryRun ? "would_write" : "written"}=${dryRun ? report.rowsBuilt : report.rowsWritten} ` +
    `hr_rows=${report.hrRows} no_pa=${report.noPlateAppearance} ` +
    `malformed=${report.malformed.length} skips=${skips}`
  );
}
