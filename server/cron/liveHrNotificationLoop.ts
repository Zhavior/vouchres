/**
 * Live home-run loop — the fast path for both settlement and alerts.
 *
 * One HR feed fetch per tick drives two writes, in this order:
 *   1. Settle matching anytime-HR legs to `won` (applyLiveHrParlayMatches)
 *   2. Create/push HOME_RUN notifications (processHomeRunEvents)
 *
 * Before this ran settlement, a home run notified in ~30s but the leg stayed
 * "pending" until the 06:00 UTC nightly grader — a ~6h gap between the public
 * evidence and the graded slip.
 *
 * Losses are NOT settled here. A missed anytime-HR leg is only knowable once the
 * game is final, so the nightly grader still owns those (fail-closed by design).
 *
 * Env:
 *   HR_NOTIFICATION_LOOP_ENABLED=false   — kill the whole loop
 *   HR_LIVE_SETTLEMENT_ENABLED=false     — keep notifications, skip grade writes
 */
import { runWithDistributedLock } from "../lib/distributedLock";
import { getTodayHomeRuns } from "../services/mlb/hrFeedService";
import { processHomeRunEvents } from "../services/notifications/notificationService";
import { applyLiveHrParlayMatches } from "../services/grading/liveHrParlayWriteService";
import { captureGradingFailure } from "../lib/sentry";

const DEFAULT_INTERVAL_MS = 30_000;
// Crash guard only — the lock is released in a finally, so this just bounds how long a
// dead holder blocks the next tick. Sized above one full settle+notify pass.
const DEFAULT_LOCK_TTL_SECONDS = 60;
const LOOP_LOCK_NAME = "notifications:live-hr-scan";

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export type LiveHrLoopHandle = {
  stop: () => void;
};

/**
 * Settles anytime-HR legs from the feed this tick already fetched.
 *
 * Never throws: a Supabase hiccup here must not stop home-run notifications from
 * going out. The `vouchedge-live-hr-sync` Render cron and the nightly grader both
 * remain as backstops.
 */
async function settleLiveHrLegs(events: Awaited<ReturnType<typeof getTodayHomeRuns>>["events"]): Promise<void> {
  if (process.env.HR_LIVE_SETTLEMENT_ENABLED === "false") return;

  try {
    // Same lock the backstop job and the HTTP ops route use — one operation, one lock.
    // waitMs:0 means a concurrent holder makes us skip this tick rather than block
    // notifications behind it; the next tick is 30s away.
    const settled = await runWithDistributedLock(
      "parlays:live-hr-sync",
      () => applyLiveHrParlayMatches(undefined, { events }),
      { ttlSeconds: 120, waitMs: 0 },
    );
    if (settled.updatedLegs > 0 || settled.skipped > 0) {
      console.log(
        `[liveHrLoop] settle checked=${settled.checked} updatedLegs=${settled.updatedLegs} insertedEvents=${settled.insertedEvents} duplicateEvents=${settled.duplicateEvents} skipped=${settled.skipped}`,
      );
    }
  } catch (error: any) {
    if (String(error?.code ?? "") === "conflict") return;
    console.error("[liveHrLoop] live settlement failed", (error as Error)?.message);
    captureGradingFailure(error, { source: "cron", cron: true, extra: { loop: "live-hr-settlement" } });
  }
}

async function runLiveHrNotificationScan(): Promise<void> {
  await runWithDistributedLock(
    LOOP_LOCK_NAME,
    async () => {
      const feed = await getTodayHomeRuns();

      // Settle before notifying so the leg already reads "won" by the time the
      // push lands — the whole point of the fast path.
      await settleLiveHrLegs(feed.events);

      const result = await processHomeRunEvents(feed.events);
      if (result.scanned > 0 || result.created > 0 || result.duplicates > 0) {
        console.log(
          `[liveHrLoop] scanned=${result.scanned} created=${result.created} duplicates=${result.duplicates} pushSent=${result.pushSent} pushSkipped=${result.pushSkipped}`,
        );
      }
      if (result.warnings.length > 0) {
        console.warn(`[liveHrLoop] warnings: ${result.warnings.join(" | ")}`);
      }
    },
    {
      ttlSeconds: readPositiveInt(process.env.HR_NOTIFICATION_LOOP_LOCK_TTL_SECONDS, DEFAULT_LOCK_TTL_SECONDS),
      waitMs: 1_000,
      pollMs: 150,
    },
  );
}

export function startLiveHrNotificationLoop(): LiveHrLoopHandle | null {
  const enabled = process.env.HR_NOTIFICATION_LOOP_ENABLED !== "false";
  if (!enabled) {
    console.log("[liveHrLoop] disabled by HR_NOTIFICATION_LOOP_ENABLED=false");
    return null;
  }

  const intervalMs = readPositiveInt(process.env.HR_NOTIFICATION_LOOP_INTERVAL_MS, DEFAULT_INTERVAL_MS);
  let timer: NodeJS.Timeout | null = null;
  let stopped = false;

  const tick = async () => {
    if (stopped) return;
    try {
      await runLiveHrNotificationScan();
    } catch (error: any) {
      if (String(error?.code ?? "") === "conflict") {
        return;
      }
      console.error("[liveHrLoop] scan failed", error);
    }
  };

  void tick();
  timer = setInterval(() => {
    void tick();
  }, intervalMs);
  timer.unref?.();

  console.log(`[liveHrLoop] scheduled every ${intervalMs}ms`);

  return {
    stop: () => {
      stopped = true;
      if (timer) clearInterval(timer);
      timer = null;
    },
  };
}
