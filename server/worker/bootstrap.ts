import { startLiveHrNotificationLoop, type LiveHrLoopHandle } from "../cron/liveHrNotificationLoop";
import { startNotificationWorker } from "../services/notifications/notificationWorker";
import { captureException } from "../lib/sentry";

export interface WorkerRuntimeHandle {
  stop: () => void;
}

export function startWorkerRuntime(): WorkerRuntimeHandle {
  console.log("[worker] Starting VouchEdge durable worker runtime...");
  
  let hrLoopHandle: LiveHrLoopHandle | null = null;
  let notificationWorkerHandle: { stop: () => void } | null = null;

  try {
    hrLoopHandle = startLiveHrNotificationLoop();
    console.log("[worker] Live HR Notification loop registered.");
  } catch (err) {
    console.error("[worker] Failed to start Live HR Notification loop:", err);
    captureException(err instanceof Error ? err : new Error(String(err)));
  }

  try {
    notificationWorkerHandle = startNotificationWorker();
    console.log("[worker] Notification worker registered.");
  } catch (err) {
    console.error("[worker] Failed to start Notification worker:", err);
    captureException(err instanceof Error ? err : new Error(String(err)));
  }

  return {
    stop: () => {
      console.log("[worker] Stopping VouchEdge durable worker runtime...");
      hrLoopHandle?.stop();
      notificationWorkerHandle?.stop();
    },
  };
}
