import { applyLiveHrParlayMatches } from "../services/grading/liveHrParlayWriteService";
import { runWithDistributedLock } from "../lib/distributedLock";
import { captureGradingFailure } from "../lib/sentry";

/**
 * Live HR settlement backstop.
 *
 * The primary fast path is the in-process loop (server/cron/liveHrNotificationLoop.ts),
 * which settles within ~30s of a home run. This job exists to cover the two gaps that
 * loop cannot:
 *
 *   1. Web service down / restarting — the loop lives inside the web dyno.
 *   2. Legs whose game_date is not today — the loop injects only today's feed, so
 *      this job runs with no injected events and lets the service derive scan dates
 *      from the pending legs themselves.
 *
 * Shares the `parlays:live-hr-sync` lock with the HTTP cron route so this can never
 * race an ops-triggered run.
 *
 * Run manually:
 *   npx tsx server/cron/liveHrSyncJob.ts
 */
async function main() {
  console.log(`[liveHrSyncJob] starting at ${new Date().toISOString()}`);

  try {
    const result = await runWithDistributedLock(
      "parlays:live-hr-sync",
      () => applyLiveHrParlayMatches(),
      { ttlSeconds: 300, waitMs: 5_000 },
    );

    console.log(
      `[liveHrSyncJob] checked=${result.checked} updatedLegs=${result.updatedLegs} insertedEvents=${result.insertedEvents} duplicateEvents=${result.duplicateEvents} skipped=${result.skipped}`,
    );
    console.log("[liveHrSyncJob] complete");
  } catch (err: any) {
    // Another holder (HTTP ops trigger, or an overlapping run) — not a failure.
    if (String(err?.code ?? "") === "conflict") {
      console.log("[liveHrSyncJob] skipped — another live-hr-sync is in progress");
      return;
    }
    console.error("[liveHrSyncJob] fatal error", err);
    captureGradingFailure(err, { source: "cron", cron: true, extra: { job: "live-hr-sync" } });
    process.exit(1);
  }
}

main();
