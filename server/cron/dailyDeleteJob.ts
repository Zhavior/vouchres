import { processScheduledDeletions } from "../routes/privacyRoutes";

/**
 * Daily deletion job — processes account deletion requests past their
 * 30-day grace period.
 *
 * SCHEDULE: 4 AM UTC daily (midnight PT, low-traffic window)
 *
 * Render Cron config:
 *   - type: cron
 *     name: vouchedge-deleter
 *     runtime: node
 *     plan: starter
 *     schedule: "0 4 * * *"
 *     command: node dist/dailyDeleteJob.cjs
 *
 * Run manually for testing:
 *   npx tsx server/cron/dailyDeleteJob.ts
 */

async function main() {
  console.log(`[deleteJob] starting at ${new Date().toISOString()}`);

  try {
    const result = await processScheduledDeletions();

    console.log("[deleteJob] summary:");
    console.log(`  Processed: ${result.processed}`);
    console.log(`  Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log("  Error details:");
      for (const err of result.errors) {
        console.log(`    ${err}`);
      }
    }
  } catch (err) {
    console.error("[deleteJob] fatal error", err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
