import { startLiveHrNotificationLoop, type LiveHrLoopHandle } from "../cron/liveHrNotificationLoop";
import { startNotificationWorker } from "../services/notifications/notificationWorker";
import { startStripeWebhookWorker } from "../services/billing/stripeWebhookWorker";
import { startSocialOutboxWorker } from "../services/social/socialOutboxWorker";
import { captureException } from "../lib/sentry";

export interface WorkerRuntimeHandle {
  stop: () => void;
}

export function startWorkerRuntime(): WorkerRuntimeHandle {
  console.log("[worker] Starting VouchEdge durable worker runtime...");

  let hrLoopHandle: LiveHrLoopHandle | null = null;
  let notificationWorkerHandle: { stop: () => void } | null = null;
  let stripeWebhookWorkerHandle: { stop: () => void } | null = null;
  let socialOutboxWorkerHandle: { stop: () => void } | null = null;

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

  try {
    stripeWebhookWorkerHandle = startStripeWebhookWorker();
    console.log("[worker] Stripe webhook entitlement worker registered.");
  } catch (err) {
    console.error("[worker] Failed to start Stripe webhook worker:", err);
    captureException(err instanceof Error ? err : new Error(String(err)));
  }

  try {
    socialOutboxWorkerHandle = startSocialOutboxWorker();
    console.log("[worker] Social outbox fanout worker registered.");
  } catch (err) {
    console.error("[worker] Failed to start Social outbox worker:", err);
    captureException(err instanceof Error ? err : new Error(String(err)));
  }

  return {
    stop: () => {
      console.log("[worker] Stopping VouchEdge durable worker runtime...");
      hrLoopHandle?.stop();
      notificationWorkerHandle?.stop();
      stripeWebhookWorkerHandle?.stop();
      socialOutboxWorkerHandle?.stop();
    },
  };
}
