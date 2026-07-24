import type Stripe from "stripe";
import {
  bumpStripeWebhookAttempts,
  claimQueuedStripeWebhookEvents,
  finishStripeWebhookEvent,
} from "./stripeService";
import { processStripeWebhookEvent } from "./stripeWebhookProcessor";

function isStripeEvent(value: unknown): value is Stripe.Event {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as { id?: unknown }).id === "string" &&
      typeof (value as { type?: unknown }).type === "string",
  );
}

export async function processStripeWebhookJobsBatch(): Promise<number> {
  const claimed = await claimQueuedStripeWebhookEvents(25);
  if (claimed.length === 0) return 0;

  let processed = 0;
  for (const row of claimed) {
    try {
      await bumpStripeWebhookAttempts(row.id);
      if (!isStripeEvent(row.payload)) {
        await finishStripeWebhookEvent(row.id, "failed", "missing_or_invalid_webhook_payload");
        continue;
      }
      await processStripeWebhookEvent(row.payload);
      await finishStripeWebhookEvent(row.id, "processed");
      processed += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "webhook_worker_failed";
      console.error(`[stripeWebhookWorker] event=${row.id} failed:`, message);
      await finishStripeWebhookEvent(row.id, "failed", message);
    }
  }
  return processed;
}

export function startStripeWebhookWorker(pollMs = 2000): { stop: () => void } {
  console.log("[stripeWebhookWorker] starting polling loop...");
  const timer = setInterval(() => {
    processStripeWebhookJobsBatch().catch((err) => {
      console.error("[stripeWebhookWorker] fatal loop error", err);
    });
  }, pollMs);

  return {
    stop: () => clearInterval(timer),
  };
}
