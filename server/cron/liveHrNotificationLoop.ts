import { runWithDistributedLock } from "../lib/distributedLock";
import { getTodayHomeRuns } from "../services/mlb/hrFeedService";
import { processHomeRunEvents } from "../services/notifications/notificationService";

const DEFAULT_INTERVAL_MS = 30_000;
const DEFAULT_LOCK_TTL_SECONDS = 25;
const LOOP_LOCK_NAME = "notifications:live-hr-scan";

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export type LiveHrLoopHandle = {
  stop: () => void;
};

async function runLiveHrNotificationScan(): Promise<void> {
  await runWithDistributedLock(
    LOOP_LOCK_NAME,
    async () => {
      const feed = await getTodayHomeRuns();
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
