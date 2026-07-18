import { beforeEach, describe, expect, it, vi } from "vitest";

const del = vi.fn();

vi.mock("stripe", () => ({
  default: class StripeMock {
    customers = { del };
    constructor(_key: string, _opts?: unknown) {}
  },
}));

vi.mock("../server/middleware/auth", () => ({
  getSupabaseAdmin: vi.fn(async () => ({})),
}));

describe("deleteStripeCustomer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
  });

  it("deletes the Stripe customer", async () => {
    del.mockResolvedValueOnce({});
    const { deleteStripeCustomer } = await import("../server/services/billing/stripeService");
    await deleteStripeCustomer("cus_123");
    expect(del).toHaveBeenCalledWith("cus_123");
  });

  it("treats already-missing customers as success", async () => {
    del.mockRejectedValueOnce({ code: "resource_missing", statusCode: 404 });
    const { deleteStripeCustomer } = await import("../server/services/billing/stripeService");
    await expect(deleteStripeCustomer("cus_gone")).resolves.toBeUndefined();
  });
});
