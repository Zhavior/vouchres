/**
 * Nightly HR outcome ingest (HR-M1, Batch 2).
 *
 * A scheduler around Batch 1's builder and nothing more. Every transform lives
 * in server/services/hr-history/outcomeBuilder.ts and every write in
 * outcomeWriter.ts, so this job and scripts/backfillHrOutcomes.ts cannot drift
 * into producing different labels for the same game.
 *
 * WHY TWO DATES
 *   The previous slate is the point of the run. The slate before it is
 *   re-checked because a game that was suspended, in a rain delay, or still in
 *   extra innings on the first pass wrote nothing at all — so it is simply not
 *   in the already-ingested set, and this run picks it up. No state to track:
 *   "has rows" is the record of completion.
 *
 * SCHEDULING
 *   Render Cron Job:  daily, 09:00 UTC  ->  node dist/hrOutcomeIngest.cjs
 *   or invoke via:    npm run hr:ingest-outcomes
 *
 *   09:00 UTC is chosen so the previous UTC date is a finished slate: a 23:10Z
 *   first pitch ends around 02:30Z the following UTC day, well before the run.
 *   Running earlier is safe but wasteful — unfinished games are skipped and
 *   retried, never half-ingested.
 *
 * FLAGS
 *   --dry-run              build and report, write nothing, open no client
 *   --date=YYYY-MM-DD      ingest exactly this slate and skip the re-check
 */

import {
  DEFAULT_REQUEST_DELAY_MS,
  formatDateReport,
  ingestOutcomesForDate,
  type IngestDateReport,
} from "../services/hr-history/outcomeIngest";

const LABEL = "[HR_OUTCOMES]";

export interface OutcomeIngestFlags {
  dryRun: boolean;
  date: string | null;
}

export function parseFlags(argv: string[]): OutcomeIngestFlags {
  const value = (name: string): string | null => {
    const hit = argv.find((arg) => arg.startsWith(`--${name}=`));
    return hit ? hit.slice(name.length + 3) : null;
  };
  return { dryRun: argv.includes("--dry-run"), date: value("date") };
}

/**
 * Which slates this run covers. Pure, so the window can be tested without a
 * clock: [previous slate, the one before it]. UTC-stepped, so a DST change
 * cannot make the job skip a date or ingest one twice.
 *
 * An explicit --date is exactly one date. A manual run targeting one slate
 * should not quietly touch its neighbour.
 */
export function slateDatesToIngest(now: Date, explicitDate: string | null): string[] {
  if (explicitDate) return [explicitDate];
  const midnightUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return [
    new Date(midnightUtc - 86_400_000).toISOString().slice(0, 10),
    new Date(midnightUtc - 2 * 86_400_000).toISOString().slice(0, 10),
  ];
}

export interface RunResult {
  reports: IngestDateReport[];
  failedDates: string[];
}

export async function runOutcomeIngest(
  flags: OutcomeIngestFlags,
  now: Date = new Date(),
): Promise<RunResult> {
  const label = flags.dryRun ? `${LABEL}[dry-run]` : LABEL;
  const dates = slateDatesToIngest(now, flags.date);

  console.log(
    `${label} start ${now.toISOString()} — slates: ${dates.join(", ")}` +
      (flags.date ? " (explicit --date, no re-check)" : " (previous slate + re-check)"),
  );

  // Supabase is imported only outside dry-run, so a dry run provably cannot
  // initialize a client, read, or insert.
  let db: Awaited<ReturnType<typeof import("../middleware/auth").getSupabaseAdmin>> | null = null;
  if (!flags.dryRun) {
    const { getSupabaseAdmin } = await import("../middleware/auth");
    db = await getSupabaseAdmin();
  }

  const reports: IngestDateReport[] = [];
  const failedDates: string[] = [];

  for (const [index, date] of dates.entries()) {
    const role = flags.date ? "explicit" : index === 0 ? "previous slate" : "re-check";
    try {
      const report = await ingestOutcomesForDate({
        date,
        dryRun: flags.dryRun,
        db,
        requestDelayMs: DEFAULT_REQUEST_DELAY_MS,
        label,
      });
      reports.push(report);

      console.log(`${label} [${role}] ${formatDateReport(report, flags.dryRun)}`);

      // Named individually. "3 skipped" is not an answer to "why did tonight
      // produce fewer labels than games"; the state that caused each skip is.
      const notFinal = report.games.filter((game) => game.skipReason === "not_final");
      if (notFinal.length > 0) {
        console.log(
          `${label} [${role}] ${notFinal.length} game(s) not yet final — retried on the next run: ` +
            notFinal.map((game) => `${game.gamePk}(${game.gameState})`).join(", "),
        );
      }
      const unavailable = report.games.filter(
        (game) => game.skipReason === "boxscore_unavailable" || game.skipReason === "missing_team_ids",
      );
      if (unavailable.length > 0) {
        console.warn(
          `${label} [${role}] ${unavailable.length} final game(s) yielded no usable boxscore: ` +
            unavailable.map((game) => `${game.gamePk}(${game.skipReason})`).join(", "),
        );
      }
      for (const entry of report.malformed) console.warn(`${label} [${role}] malformed: ${entry}`);
    } catch (error) {
      // One date failing must not cost the other. Nothing was written for it,
      // so the next run retries it from scratch.
      failedDates.push(date);
      console.error(
        `${label} [${role}] ${date} FAILED — ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const written = reports.reduce((sum, report) => sum + report.rowsWritten, 0);
  const built = reports.reduce((sum, report) => sum + report.rowsBuilt, 0);
  console.log(
    `${label} done — rows_${flags.dryRun ? "would_write" : "written"}=${flags.dryRun ? built : written} ` +
      `dates_ok=${reports.length} dates_failed=${failedDates.length}`,
  );
  if (flags.dryRun) console.log(`${label} dry run — no rows written`);

  return { reports, failedDates };
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2));
  try {
    const result = await runOutcomeIngest(flags);
    // A failed date is a failed run. Exiting 0 would let a silent outage look
    // like a quiet night in the cron dashboard.
    process.exit(result.failedDates.length > 0 ? 1 : 0);
  } catch (error) {
    console.error(`${LABEL} ingest failed:`, error);
    process.exit(1);
  }
}

// Only self-invoke when run directly, so importing this module in a test does
// not fire an ingest.
if (process.argv[1] && process.argv[1].includes("hrOutcomeIngest")) {
  void main();
}
