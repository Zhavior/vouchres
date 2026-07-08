import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
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

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");

  const app = express();
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
  });
});
