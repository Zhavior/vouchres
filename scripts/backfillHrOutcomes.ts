/**
 * HR outcome backfill (HR-M1, Batch 1).
 *
 * Walks a date range, sequentially, and writes one label row per batter-game.
 * Outcomes are the recoverable half of the dataset — a completed boxscore stays
 * available indefinitely — so this script can be run, interrupted, and re-run
 * without care.
 *
 * Resumability and idempotency come from the data, not from a cursor file: a
 * game that already has rows is skipped, and the insert ignores conflicts. Two
 * runs over the same range produce zero new rows the second time.
 *
 * USAGE
 *   npm run hr:backfill-outcomes -- --dry-run --from=2026-08-08 --to=2026-08-08
 *   npm run hr:backfill-outcomes -- --from=2026-04-01 --to=2026-08-08
 *
 * FLAGS
 *   --from=YYYY-MM-DD        range start (inclusive)
 *   --to=YYYY-MM-DD          range end (inclusive)
 *   --dates=a,b,c            explicit date list instead of a range
 *   --dry-run                build and report, write nothing, never open a client
 *   --delay-ms=N             pause between boxscore fetches (default 250)
 *   --stop-on-first-usable   dry-run only. Halt at the first date that yields
 *                            rows and report it — this is how the "earliest
 *                            date the feed returns usable boxscores" question
 *                            gets a measured answer instead of a guess.
 */

import {
  DEFAULT_REQUEST_DELAY_MS,
  formatDateReport,
  ingestOutcomesForDate,
  type IngestDateReport,
} from "../server/services/hr-history/outcomeIngest";

const LABEL = "[hrBackfill]";

interface Flags {
  from: string | null;
  to: string | null;
  dates: string[] | null;
  dryRun: boolean;
  delayMs: number;
  stopOnFirstUsable: boolean;
}

function parseFlags(argv: string[]): Flags {
  const value = (name: string): string | null => {
    const hit = argv.find((arg) => arg.startsWith(`--${name}=`));
    return hit ? hit.slice(name.length + 3) : null;
  };
  const delayRaw = value("delay-ms");
  return {
    from: value("from"),
    to: value("to"),
    dates: value("dates")?.split(",").map((d) => d.trim()).filter(Boolean) ?? null,
    dryRun: argv.includes("--dry-run"),
    delayMs: delayRaw != null ? Number(delayRaw) : DEFAULT_REQUEST_DELAY_MS,
    stopOnFirstUsable: argv.includes("--stop-on-first-usable"),
  };
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function assertIsoDate(value: string, field: string): void {
  if (!ISO_DATE.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new Error(`${field} must be a valid YYYY-MM-DD date (got "${value}")`);
  }
}

/** Inclusive, UTC-stepped so a DST boundary cannot duplicate or drop a date. */
function datesInRange(from: string, to: string): string[] {
  const out: string[] = [];
  const end = Date.parse(`${to}T00:00:00Z`);
  for (let t = Date.parse(`${from}T00:00:00Z`); t <= end; t += 86_400_000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

function resolveDates(flags: Flags): string[] {
  if (flags.dates) {
    for (const date of flags.dates) assertIsoDate(date, "--dates entry");
    return flags.dates;
  }
  if (!flags.from || !flags.to) {
    throw new Error("--from and --to are required (or pass --dates=a,b,c)");
  }
  assertIsoDate(flags.from, "--from");
  assertIsoDate(flags.to, "--to");
  if (Date.parse(flags.from) > Date.parse(flags.to)) {
    throw new Error(`--from (${flags.from}) is after --to (${flags.to})`);
  }
  return datesInRange(flags.from, flags.to);
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2));

  if (flags.stopOnFirstUsable && !flags.dryRun) {
    throw new Error("--stop-on-first-usable is a probe; it requires --dry-run");
  }
  if (!Number.isFinite(flags.delayMs) || flags.delayMs < 0) {
    throw new Error(`--delay-ms must be a non-negative number (got "${flags.delayMs}")`);
  }

  const dates = resolveDates(flags);
  const label = flags.dryRun ? `${LABEL}[dry-run]` : LABEL;

  console.log(
    `${label} start — ${dates.length} date(s) ${dates[0]}..${dates[dates.length - 1]} ` +
      `delay=${flags.delayMs}ms`,
  );

  // Supabase is imported only outside dry-run, so a dry run provably cannot
  // initialize a client, read, or insert.
  let db: Awaited<ReturnType<typeof import("../server/middleware/auth").getSupabaseAdmin>> | null =
    null;
  if (!flags.dryRun) {
    const { getSupabaseAdmin } = await import("../server/middleware/auth");
    db = await getSupabaseAdmin();
  }

  const reports: IngestDateReport[] = [];
  let firstUsableDate: string | null = null;
  let failedDates = 0;

  for (const date of dates) {
    let report: IngestDateReport;
    try {
      report = await ingestOutcomesForDate({
        date,
        dryRun: flags.dryRun,
        db,
        requestDelayMs: flags.delayMs,
        label,
      });
    } catch (error) {
      // One bad date does not end the range. It is counted and named, and a
      // re-run picks it up because nothing was written for it.
      failedDates += 1;
      console.error(
        `${label} ${date}: FAILED — ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }

    reports.push(report);
    console.log(`${label} ${formatDateReport(report, flags.dryRun)}`);

    // Per-game detail on a dry run, so counts can be checked against the real
    // slate rather than trusted in aggregate.
    if (flags.dryRun) {
      for (const game of report.games) {
        console.log(
          `${label}   game=${game.gamePk} state="${game.gameState}" rows=${game.rows}` +
            (game.skipReason ? ` skip=${game.skipReason}${game.skipDetail ? ` (${game.skipDetail})` : ""}` : ""),
        );
      }
    }

    for (const entry of report.malformed) console.warn(`${label}   malformed: ${entry}`);

    if (report.rowsBuilt > 0 && firstUsableDate == null) {
      firstUsableDate = date;
      if (flags.stopOnFirstUsable) {
        console.log(
          `${label} MEASURED earliest usable boxscore date in the probed set: ${date} ` +
            `(${report.rowsBuilt} row(s) from ${report.gamesProcessed} game(s)). ` +
            `This is the earliest date PROBED that produced rows — not proof that no earlier date works.`,
        );
        break;
      }
    }
  }

  const totals = reports.reduce(
    (acc, report) => ({
      scheduled: acc.scheduled + report.scheduledGames,
      processed: acc.processed + report.gamesProcessed,
      built: acc.built + report.rowsBuilt,
      written: acc.written + report.rowsWritten,
      hr: acc.hr + report.hrRows,
      noPa: acc.noPa + report.noPlateAppearance,
      malformed: acc.malformed + report.malformed.length,
    }),
    { scheduled: 0, processed: 0, built: 0, written: 0, hr: 0, noPa: 0, malformed: 0 },
  );

  const skipTotals: Record<string, number> = {};
  for (const report of reports) {
    for (const [reason, count] of Object.entries(report.skipCounts)) {
      skipTotals[reason] = (skipTotals[reason] ?? 0) + count;
    }
  }

  console.log(`${label} ===== totals over ${reports.length} completed date(s) =====`);
  console.log(`${label} scheduled_games=${totals.scheduled} games_processed=${totals.processed}`);
  console.log(
    `${label} rows_${flags.dryRun ? "would_write" : "written"}=${flags.dryRun ? totals.built : totals.written} ` +
      `rows_built=${totals.built} hr_rows=${totals.hr}`,
  );
  console.log(
    `${label} roster_entries_without_plate_appearance=${totals.noPa} (no row by definition) ` +
      `malformed=${totals.malformed}`,
  );
  console.log(`${label} skips=${JSON.stringify(skipTotals)}`);
  if (failedDates > 0) console.log(`${label} dates that errored and wrote nothing: ${failedDates}`);
  console.log(
    `${label} earliest date in this run that produced rows: ${firstUsableDate ?? "none"}`,
  );
  if (flags.dryRun) console.log(`${label} dry run — no rows written`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`${LABEL} fatal:`, error);
    process.exit(1);
  });
