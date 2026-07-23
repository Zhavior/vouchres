import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../server/services/billing/stripeService", () => ({
  bumpStripeWebhookAttempts: vi.fn(async () => undefined),
  claimQueuedStripeWebhookEvents: vi.fn(async () => []),
  finishStripeWebhookEvent: vi.fn(async () => undefined),
}));

vi.mock("../server/services/billing/stripeWebhookProcessor", () => ({
  processStripeWebhookEvent: vi.fn(async () => undefined),
}));

describe("stripeWebhookWorker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("processes claimed queued events and marks them processed", async () => {
    const stripeService = await import("../server/services/billing/stripeService");
    const processor = await import("../server/services/billing/stripeWebhookProcessor");
    const event = {
      id: "evt_worker_1",
      object: "event",
      type: "customer.subscription.updated",
      data: { object: { id: "sub_1" } },
    };

    vi.mocked(stripeService.claimQueuedStripeWebhookEvents).mockResolvedValueOnce([
      {
        id: "evt_worker_1",
        type: "customer.subscription.updated",
        payload: event as any,
        attempts: 0,
      },
    ]);

    const { processStripeWebhookJobsBatch } = await import(
      "../server/services/billing/stripeWebhookWorker"
    );
    const count = await processStripeWebhookJobsBatch();

    expect(count).toBe(1);
    expect(processor.processStripeWebhookEvent).toHaveBeenCalledWith(event);
    expect(stripeService.finishStripeWebhookEvent).toHaveBeenCalledWith("evt_worker_1", "processed");
  });

  it("marks missing payloads as failed", async () => {
    const stripeService = await import("../server/services/billing/stripeService");
    vi.mocked(stripeService.claimQueuedStripeWebhookEvents).mockResolvedValueOnce([
      {
        id: "evt_bad",
        type: "checkout.session.completed",
        payload: null,
        attempts: 1,
      },
    ]);

    const { processStripeWebhookJobsBatch } = await import(
      "../server/services/billing/stripeWebhookWorker"
    );
    const count = await processStripeWebhookJobsBatch();

    expect(count).toBe(0);
    expect(stripeService.finishStripeWebhookEvent).toHaveBeenCalledWith(
      "evt_bad",
      "failed",
      "missing_or_invalid_webhook_payload",
    );
  });
});
