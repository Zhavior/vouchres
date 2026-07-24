import { beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.fn();
const retrieve = vi.fn();
const del = vi.fn();
const maybeSingle = vi.fn();
const select = vi.fn(() => ({ maybeSingle }));
const eq = vi.fn(() => ({ select }));
const update = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      single: vi.fn(async () => ({ data: { stripe_customer_id: null }, error: null })),
    })),
  })),
  update,
}));

vi.mock("stripe", () => ({
  default: class StripeMock {
    customers = { create, retrieve, del };
    constructor(_key: string, _opts?: unknown) {}
  },
}));

vi.mock("../server/middleware/auth", () => ({
  getSupabaseAdmin: vi.fn(async () => ({ from })),
}));

vi.mock("../server/lib/distributedLock", () => ({
  runWithDistributedLock: vi.fn(async (_key: string, fn: () => Promise<unknown>) => fn()),
}));

describe("ensureStripeCustomer bind failure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    create.mockResolvedValue({ id: "cus_new_1", deleted: false });
    del.mockResolvedValue({});
  });

  it("deletes the Stripe customer and throws when profile bind fails", async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: { message: "db down" } });
    const { ensureStripeCustomer } = await import("../server/services/billing/stripeService");

    await expect(ensureStripeCustomer("profile-1", "a@example.com")).rejects.toMatchObject({
      details: { reason: "stripe_customer_bind_failed" },
    });
    expect(create).toHaveBeenCalled();
    expect(del).toHaveBeenCalledWith("cus_new_1");
  });
});
