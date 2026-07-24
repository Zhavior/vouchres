import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { requestContext } from "../server/middleware/requestContext";
import { billingRoutes } from "../server/routes/billingRoutes";

vi.mock("../server/services/billing/stripeService", () => ({
  isStripeConfigured: vi.fn(() => false),
  getStripe: vi.fn(),
  createCheckoutSession: vi.fn(),
  createPortalSession: vi.fn(),
  beginStripeWebhookEvent: vi.fn(),
  finishStripeWebhookEvent: vi.fn(),
  syncSubscription: vi.fn(),
}));

vi.mock("../server/middleware/auth", () => ({
  requireAuth: (req: any, _res: unknown, next: () => void) => {
    req.user = {
      id: "user_billing_1",
      email: "billing@test.com",
      profile: { tier: "free", id: "user_billing_1" },
    };
    next();
  },
  getSupabaseAdmin: vi.fn(async () => ({
    from: vi.fn(() => ({
      update: () => ({
        eq: async () => ({ error: null }),
      }),
    })),
  })),
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
      }),
    })),
  },
}));

vi.mock("../server/services/billing/tierConfig", () => ({
  getTierEntitlements: vi.fn(() => ({
    tier: "free",
    monthlyCustomizationPoints: 0,
    canUseProGraphs: false,
    canUseTeamMatchupLab: false,
    canUsePlayerEdgeLab: false,
    canAccessNotifications: false,
    warnings: [],
  })),
  normalizeSubscriptionTier: vi.fn(() => ({ tier: "free", sourceTier: "free", warnings: [] })),
  getStripePriceMatrix: vi.fn(() => ({})),
  getStripePriceId: vi.fn(),
}));

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");

  const app = express();
  app.use(requestContext);
  app.use(express.json());
  app.use("/api/billing", billingRoutes);
  app.use("/api/billing", apiErrorHandler);

  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Test server did not bind.");
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  vi.unstubAllEnvs();
});

describe("billing routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("STRIPE_WEBHOOK_PROCESS_INLINE", "");
  });

  it("returns ok envelope with request metadata for billing status", async () => {
    const response = await fetch(`${baseUrl}/api/billing/status`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      tier: "free",
      status: "free",
      meta: {
        requestId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
  });

  it("returns unified error envelope when Stripe is not configured for webhook", async () => {
    const response = await fetch(`${baseUrl}/api/billing/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "ping" }),
    });
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "external_service_error",
        message: "Stripe is not configured.",
      },
    });
  });

  it("returns unified error envelope when webhook signature is missing", async () => {
    const { isStripeConfigured } = await import("../server/services/billing/stripeService");
    vi.mocked(isStripeConfigured).mockReturnValueOnce(true);
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");

    const response = await fetch(`${baseUrl}/api/billing/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "ping" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "bad_request",
        message: "Missing Stripe signature header.",
      },
    });
    expect(typeof body.error.requestId).toBe("string");
    expect(body.error.requestId.length).toBeGreaterThan(0);
    expect(response.headers.get("x-request-id")).toBe(body.error.requestId);
  });

  it("returns unified error envelope when webhook signature is invalid", async () => {
    const stripeService = await import("../server/services/billing/stripeService");
    vi.mocked(stripeService.isStripeConfigured).mockReturnValueOnce(true);
    vi.mocked(stripeService.getStripe).mockReturnValueOnce({
      webhooks: {
        constructEvent: vi.fn(() => {
          throw new Error("No signatures found matching the expected signature for payload");
        }),
      },
    } as any);
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");

    const response = await fetch(`${baseUrl}/api/billing/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "t=1,v1=bad",
      },
      body: JSON.stringify({ type: "ping" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "bad_request",
        message: "Invalid Stripe webhook signature.",
      },
    });
    expect(typeof body.error.requestId).toBe("string");
    expect(response.headers.get("x-request-id")).toBe(body.error.requestId);
  });

  it("acks verified webhooks as queued without applying entitlements inline", async () => {
    const stripeService = await import("../server/services/billing/stripeService");
    const event = {
      id: "evt_fail_1",
      type: "checkout.session.completed",
      data: {
        object: {
          subscription: "sub_fail_1",
        },
      },
    };

    vi.mocked(stripeService.isStripeConfigured).mockReturnValue(true);
    vi.mocked(stripeService.beginStripeWebhookEvent).mockResolvedValueOnce({
      shouldProcess: true,
      duplicate: false,
      status: "queued",
    } as any);
    vi.mocked(stripeService.getStripe).mockReturnValue({
      webhooks: {
        constructEvent: vi.fn(() => event),
      },
      subscriptions: {
        retrieve: vi.fn(async () => {
          throw new Error("stripe retrieve failed");
        }),
      },
    } as any);
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    vi.stubEnv("STRIPE_WEBHOOK_PROCESS_INLINE", "");

    const response = await fetch(`${baseUrl}/api/billing/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "t=1,v1=good",
      },
      body: JSON.stringify({ type: "checkout.session.completed" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      received: true,
      queued: true,
      status: "queued",
    });
    expect(stripeService.syncSubscription).not.toHaveBeenCalled();
    expect(stripeService.finishStripeWebhookEvent).not.toHaveBeenCalled();
  });

  it("queues a signed checkout.session.completed webhook for the entitlement worker", async () => {
    const stripeService = await import("../server/services/billing/stripeService");
    const event = {
      id: "evt_test_1",
      type: "checkout.session.completed",
      data: {
        object: {
          subscription: "sub_test_1",
        },
      },
    };

    const stripeClient = {
      webhooks: {
        constructEvent: vi.fn(() => event),
      },
      subscriptions: {
        retrieve: vi.fn(async () => ({
          id: "sub_test_1",
          status: "active",
        })),
      },
    };

    vi.mocked(stripeService.isStripeConfigured).mockReturnValue(true);
    vi.mocked(stripeService.beginStripeWebhookEvent).mockResolvedValueOnce({
      shouldProcess: true,
      duplicate: false,
      status: "queued",
    } as any);
    vi.mocked(stripeService.getStripe).mockReturnValue(stripeClient as any);
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    vi.stubEnv("STRIPE_WEBHOOK_PROCESS_INLINE", "");

    const response = await fetch(`${baseUrl}/api/billing/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "t=1,v1=good",
      },
      body: JSON.stringify({ type: "checkout.session.completed" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, received: true, queued: true, status: "queued" });
    expect(stripeService.syncSubscription).not.toHaveBeenCalled();
    expect(stripeService.finishStripeWebhookEvent).not.toHaveBeenCalled();
  });

  it("processes entitlements inline when STRIPE_WEBHOOK_PROCESS_INLINE=1", async () => {
    const stripeService = await import("../server/services/billing/stripeService");
    const event = {
      id: "evt_inline_1",
      type: "checkout.session.completed",
      data: {
        object: {
          subscription: "sub_inline_1",
        },
      },
    };

    vi.mocked(stripeService.isStripeConfigured).mockReturnValue(true);
    vi.mocked(stripeService.beginStripeWebhookEvent).mockResolvedValueOnce({
      shouldProcess: true,
      duplicate: false,
      status: "queued",
    } as any);
    vi.mocked(stripeService.finishStripeWebhookEvent).mockResolvedValueOnce(undefined as any);
    vi.mocked(stripeService.syncSubscription).mockResolvedValueOnce(undefined as any);
    vi.mocked(stripeService.getStripe).mockReturnValue({
      webhooks: {
        constructEvent: vi.fn(() => event),
      },
      subscriptions: {
        retrieve: vi.fn(async () => ({
          id: "sub_inline_1",
          status: "active",
          metadata: { profile_id: "user_billing_1" },
          items: { data: [{ price: { id: "price_test" } }] },
          customer: "cus_test",
        })),
      },
    } as any);
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    vi.stubEnv("STRIPE_WEBHOOK_PROCESS_INLINE", "1");

    const response = await fetch(`${baseUrl}/api/billing/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "t=1,v1=good",
      },
      body: JSON.stringify({ type: "checkout.session.completed" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, received: true, processed: true });
    expect(stripeService.syncSubscription).toHaveBeenCalled();
    expect(stripeService.finishStripeWebhookEvent).toHaveBeenCalledWith("evt_inline_1", "processed");
  });

  it("skips duplicate Stripe webhook events", async () => {
    const stripeService = await import("../server/services/billing/stripeService");
    const event = {
      id: "evt_dup_1",
      type: "customer.subscription.updated",
      data: { object: { id: "sub_dup" } },
    };

    vi.mocked(stripeService.isStripeConfigured).mockReturnValueOnce(true);
    vi.mocked(stripeService.beginStripeWebhookEvent).mockResolvedValueOnce({
      shouldProcess: false,
      status: "processed",
    } as any);
    vi.mocked(stripeService.getStripe).mockReturnValueOnce({
      webhooks: {
        constructEvent: vi.fn(() => event),
      },
    } as any);
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");

    const response = await fetch(`${baseUrl}/api/billing/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "t=1,v1=good",
      },
      body: JSON.stringify({ type: "customer.subscription.updated" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      received: true,
      duplicate: true,
      status: "processed",
    });
  });
});
