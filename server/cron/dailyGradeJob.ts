import { gradePendingPicks } from "../services/grading/gradingService";

/**
 * Daily grade job — runs nightly to grade picks from the previous day's games.
 *
 * SCHEDULING OPTIONS — pick one:
 *
 * 1. Render Cron Job (recommended — free for hourly, $7/mo plan for sub-hourly)
 *    In render.yaml, add:
 *      - type: cron
 *        name: vouchedge-grader
 *        runtime: node
 *        plan: starter
 *        schedule: "0 6 * * *"  # 2 AM ET = 6 AM UTC
 *        command: node dist/gradeJob.cjs
 *        envVars: [same as web service]
 *
 * 2. node-cron (in-process, runs inside the Express server)
 *    Uncomment the startInProcessCron() call at the bottom of this file.
 *    Downsides: tied to server uptime, no isolation, sleeps on Render free tier.
 *
 * 3. External scheduler (GitHub Actions, cron-job.org, etc.)
 *    POST to /api/admin/grade-pending with a staff API key.
 *
 * Run manually for testing:
 *   npx tsx server/cron/dailyGradeJob.ts
 *   npx tsx server/cron/dailyGradeJob.ts --dry-run
 */

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(`[gradeJob] starting (dryRun=${dryRun}) at ${new Date().toISOString()}`);

  try {
    const result = await gradePendingPicks({ days: 3, dryRun });

    console.log("[gradeJob] summary:");
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
      console.log("[gradeJob] dry run — no picks were updated");
    } else {
      console.log("[gradeJob] complete");
    }
  } catch (err) {
    console.error("[gradeJob] fatal error", err);
    process.exit(1);
  }
}

/**
 * In-process cron — only use if you can't set up an external scheduler.
 * Requires: npm install node-cron
 */
export async function startInProcessCron() {
  const cron = await import("node-cron");
  // 2 AM ET = 6 AM UTC (during DST; 7 UTC during standard time — use 6 for simplicity)
  cron.schedule("0 6 * * *", async () => {
    console.log("[cron] daily grade job triggered");
    try {
      await gradePendingPicks({ days: 3 });
    } catch (err) {
      console.error("[cron] grade job failed", err);
    }
  });
  console.log("[cron] daily grade job scheduled for 06:00 UTC");
}

// Run if invoked directly
if (require.main === module) {
  main();
}
