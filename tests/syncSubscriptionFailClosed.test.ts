import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../server/middleware/auth", () => ({
  getSupabaseAdmin: vi.fn(async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn(async () => ({ data: null, error: null })),
        }),
      }),
    }),
  })),
}));

describe("syncSubscription fail-closed", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
  });

  it("throws when subscription has no profile_id", async () => {
    const { syncSubscription } = await import("../server/services/billing/stripeService");
    await expect(
      syncSubscription({
        id: "sub_missing_profile",
        metadata: {},
        status: "active",
        items: { data: [{ price: { id: "price_unknown" } }] },
        customer: "cus_1",
      } as any),
    ).rejects.toThrow(/no profile_id/i);
  });
});
