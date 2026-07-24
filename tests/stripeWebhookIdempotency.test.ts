import { beforeEach, describe, expect, it, vi } from "vitest";

const maybeSingle = vi.fn();
const selectEq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq: selectEq }));

const updateSelect = vi.fn();
const updateLt = vi.fn(() => ({ select: updateSelect }));
const updateEqStatus = vi.fn(() => ({ select: updateSelect, lt: updateLt }));
const updateEqId = vi.fn(() => ({ eq: updateEqStatus }));
const update = vi.fn(() => ({ eq: updateEqId }));

const insert = vi.fn();
const from = vi.fn((table: string) => {
  if (table !== "stripe_webhook_events") throw new Error(`unexpected table ${table}`);
  return { insert, select, update };
});

vi.mock("../server/middleware/auth", () => ({
  getSupabaseAdmin: vi.fn(async () => ({ from })),
}));

describe("beginStripeWebhookEvent reclaim race", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("requeues a failed webhook for the worker", async () => {
    insert.mockResolvedValueOnce({
      error: { code: "23505", message: "duplicate" },
    });
    maybeSingle.mockResolvedValueOnce({
      data: { status: "failed" },
      error: null,
    });
    const { beginStripeWebhookEvent } = await import(
      "../server/services/billing/stripeService"
    );
    const result = await beginStripeWebhookEvent({
      id: "evt_race",
      type: "customer.subscription.updated",
    } as any);

    expect(result).toEqual({
      shouldProcess: true,
      duplicate: true,
      status: "queued",
    });
    expect(updateEqStatus).toHaveBeenCalledWith("status", "failed");
  });

  it("skips a duplicate webhook that is already queued", async () => {
    insert.mockResolvedValueOnce({
      error: { code: "23505", message: "duplicate" },
    });
    maybeSingle.mockResolvedValueOnce({
      data: { status: "queued" },
      error: null,
    });

    const { beginStripeWebhookEvent } = await import(
      "../server/services/billing/stripeService"
    );
    const result = await beginStripeWebhookEvent({
      id: "evt_race",
      type: "customer.subscription.updated",
    } as any);

    expect(result).toEqual({
      shouldProcess: false,
      duplicate: true,
      status: "queued",
    });
  });

  it("reclaims stale processing webhooks after TTL", async () => {
    insert.mockResolvedValueOnce({
      error: { code: "23505", message: "duplicate" },
    });
    maybeSingle.mockResolvedValueOnce({
      data: {
        status: "processing",
        received_at: new Date(Date.now() - 20 * 60_000).toISOString(),
      },
      error: null,
    });
    updateSelect.mockResolvedValueOnce({ data: [{ id: "evt_stale" }], error: null });

    const { beginStripeWebhookEvent } = await import(
      "../server/services/billing/stripeService"
    );
    const result = await beginStripeWebhookEvent({
      id: "evt_stale",
      type: "customer.subscription.updated",
    } as any);

    expect(updateLt).toHaveBeenCalled();
    expect(result).toEqual({
      shouldProcess: true,
      duplicate: true,
      status: "processing",
    });
  });
});

describe("finishStripeWebhookEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("throws when finalization update fails", async () => {
    const finalizeEq = vi.fn(async () => ({ error: { message: "db down" } }));
    update.mockReturnValueOnce({ eq: finalizeEq });

    const { finishStripeWebhookEvent } = await import(
      "../server/services/billing/stripeService"
    );
    await expect(finishStripeWebhookEvent("evt_1", "processed")).rejects.toMatchObject({
      message: "db down",
    });
  });
});
