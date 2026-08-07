import { gradePendingPicks } from "../services/grading/gradingService";
import { captureGradingFailure } from "../lib/sentry";

/**
 * Fast-pass grade job — runs every ~10 mins to grade events whose game has gone final.
 *
 * This job relies on `fetchBoxscore` throwing for non-final games, meaning
 * it naturally acts as a "grade-due" pass without accidentally settling legs early.
 *
 * Run manually for testing:
 *   npx tsx server/cron/gradeDueJob.ts
 *   npx tsx server/cron/gradeDueJob.ts --dry-run
 */

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(`[gradeDueJob] starting (dryRun=${dryRun}) at ${new Date().toISOString()}`);

  try {
    const result = await gradePendingPicks({ days: 3, dryRun });

    console.log("[gradeDueJob] summary:");
    console.log(`  Graded: ${result.graded.length}`);
    console.log(`  Skipped: ${result.skipped.length}`);
    console.log(`  Pending remaining: ${result.summary.total_pending}`);
    console.log(`  Wins/Losses/Pushes/Voids: ${result.summary.wins}/${result.summary.losses}/${result.summary.pushes}/${result.summary.voids}`);

    if (result.skipped.length > 0) {
      const errors = result.skipped.filter((r) => r.error);
      const errorCounts = new Map<string, number>();
      for (const e of errors) {
        const key = e.error ?? "unknown";
        errorCounts.set(key, (errorCounts.get(key) ?? 0) + 1);
      }
      console.log("  Skip reasons:");
      for (const [reason, count] of errorCounts) {
        console.log(`    ${reason}: ${count}`);
      }
    }

    if (dryRun) {
      console.log("[gradeDueJob] dry run — no picks were updated");
    } else {
      console.log("[gradeDueJob] complete");
    }
  } catch (err) {
    console.error("[gradeDueJob] fatal error", err);
    captureGradingFailure(err, { source: "job", dryRun, cron: true });
    process.exit(1);
  }
}

// Run if invoked directly
main();
