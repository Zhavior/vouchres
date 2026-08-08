/**
 * Free open beta — every feature unlocked, payments off.
 *
 * The paid-path counterparts live in tests/billingRoutes.test.ts,
 * tests/premiumAuroraModel.test.ts, and tests/auroraAccessGate.test.ts, which
 * pin the beta flags off so both modes stay covered.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("free open beta — server flags", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to beta on and payments off when nothing is configured", async () => {
    vi.stubEnv("FREE_BETA_ALL_ACCESS", "");
    vi.stubEnv("PAYMENTS_ENABLED", "");
    const { isFreeBetaActive, arePaymentsEnabled } = await import("../server/lib/betaAccess");

    expect(isFreeBetaActive()).toBe(true);
    expect(arePaymentsEnabled()).toBe(false);
  });

  it("re-enables payments when the beta is switched off", async () => {
    vi.stubEnv("FREE_BETA_ALL_ACCESS", "false");
    vi.stubEnv("PAYMENTS_ENABLED", "");
    const { isFreeBetaActive, arePaymentsEnabled } = await import("../server/lib/betaAccess");

    expect(isFreeBetaActive()).toBe(false);
    expect(arePaymentsEnabled()).toBe(true);
  });

  it("grants the top tier to any stored tier while the beta runs", async () => {
    vi.stubEnv("FREE_BETA_ALL_ACCESS", "true");
    const { resolveEffectiveTier, BETA_ACCESS_TIER } = await import("../server/lib/betaAccess");

    expect(resolveEffectiveTier("free")).toBe(BETA_ACCESS_TIER);
    expect(resolveEffectiveTier(null)).toBe(BETA_ACCESS_TIER);
    expect(resolveEffectiveTier("gold")).toBe(BETA_ACCESS_TIER);
  });

  it("passes the stored tier straight through once the beta ends", async () => {
    vi.stubEnv("FREE_BETA_ALL_ACCESS", "false");
    const { resolveEffectiveTier } = await import("../server/lib/betaAccess");

    expect(resolveEffectiveTier("free")).toBe("free");
    expect(resolveEffectiveTier("gold")).toBe("gold");
  });
});

describe("free open beta — server entitlement gates", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("FREE_BETA_ALL_ACCESS", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("lets a free-tier account through a creator-only gate", async () => {
    const { requireTier } = await import("../server/middleware/entitlements");
    const next = vi.fn();

    requireTier("seller_pro")(
      { user: { id: "u1", profile: { tier: "free" } } } as never,
      {} as never,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeUndefined();
  });

  it("still rejects an unauthenticated request", async () => {
    const { requireTier } = await import("../server/middleware/entitlements");
    const next = vi.fn();

    requireTier("gold")({ user: undefined } as never, {} as never, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401, code: "missing_token" });
  });

  it("reports full entitlements for a stored free tier", async () => {
    const { getEntitlementsForTier } = await import("../server/middleware/entitlements");
    const entitlements = getEntitlementsForTier("free");

    expect(entitlements).toMatchObject({
      tier: "creator",
      canUseProGraphs: true,
      canUseTeamMatchupLab: true,
      canUsePlayerEdgeLab: true,
      canAccessNotifications: true,
    });
  });

  it("leaves free-tier entitlements alone once the beta ends", async () => {
    vi.stubEnv("FREE_BETA_ALL_ACCESS", "false");
    vi.resetModules();
    const { getEntitlementsForTier } = await import("../server/middleware/entitlements");

    expect(getEntitlementsForTier("free")).toMatchObject({
      tier: "free",
      canUseProGraphs: false,
    });
  });

  it("raises the quota ceiling for a free account to the paid one", async () => {
    const { requireTierOrQuota } = await import("../server/middleware/entitlements");
    const next = vi.fn();

    // No paid ceiling configured means paid tiers are unlimited, so the gate
    // must short-circuit before any quota lookup for a stored 'free' account.
    await requireTierOrQuota("gold", 2, "parlay_lab_saves")(
      { user: { id: "u1", profile: { tier: "free" } } } as never,
      {} as never,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeUndefined();
  });
});

describe("free open beta — auth route gates", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("FREE_BETA_ALL_ACCESS", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports the granted tier on /api/auth/me entitlements", async () => {
    const { resolveEffectiveTier } = await import("../server/lib/betaAccess");
    // /api/auth/me passes the stored tier through this helper.
    expect(resolveEffectiveTier("free")).toBe("creator");
  });

  it("accepts a profile header update from a stored free account", async () => {
    const updated = { id: "u_beta", tier: "free", header_url: "https://cdn.test/h.png" };

    vi.doMock("../server/middleware/auth", () => ({
      requireAuth: (req: any, _res: unknown, next: () => void) => {
        req.user = { id: "u_beta", profile: { tier: "free", is_staff: false } };
        next();
      },
      optionalAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
      supabaseAdmin: {
        from: () => ({
          update: () => ({
            eq: () => ({
              select: () => ({
                single: async () => ({ data: updated, error: null }),
              }),
            }),
          }),
        }),
      },
    }));

    const express = (await import("express")).default;
    const { requestContext } = await import("../server/middleware/requestContext");
    const { apiErrorHandler } = await import("../server/middleware/errorHandler");
    const { authRoutes } = await import("../server/routes/authRoutes");

    const app = express();
    app.use(requestContext);
    app.use(express.json());
    app.use("/api/auth", authRoutes);
    app.use("/api/auth", apiErrorHandler);

    const httpServer = await new Promise<import("node:http").Server>((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    const address = httpServer.address();
    if (!address || typeof address === "string") throw new Error("Test server did not bind.");

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ header_url: "https://cdn.test/h.png" }),
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ ok: true, header_url: "https://cdn.test/h.png" });
    } finally {
      await new Promise<void>((resolve, reject) => {
        httpServer.close((error) => (error ? reject(error) : resolve()));
      });
      vi.doUnmock("../server/middleware/auth");
    }
  });

  it("still blocks the header update once the beta ends", async () => {
    vi.stubEnv("FREE_BETA_ALL_ACCESS", "false");
    vi.resetModules();

    vi.doMock("../server/middleware/auth", () => ({
      requireAuth: (req: any, _res: unknown, next: () => void) => {
        req.user = { id: "u_paid", profile: { tier: "free", is_staff: false } };
        next();
      },
      optionalAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
      supabaseAdmin: { from: vi.fn() },
    }));

    const express = (await import("express")).default;
    const { requestContext } = await import("../server/middleware/requestContext");
    const { apiErrorHandler } = await import("../server/middleware/errorHandler");
    const { authRoutes } = await import("../server/routes/authRoutes");

    const app = express();
    app.use(requestContext);
    app.use(express.json());
    app.use("/api/auth", authRoutes);
    app.use("/api/auth", apiErrorHandler);

    const httpServer = await new Promise<import("node:http").Server>((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    const address = httpServer.address();
    if (!address || typeof address === "string") throw new Error("Test server did not bind.");

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ header_url: "https://cdn.test/h.png" }),
      });

      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({
        ok: false,
        error: { code: "entitlement_required" },
      });
    } finally {
      await new Promise<void>((resolve, reject) => {
        httpServer.close((error) => (error ? reject(error) : resolve()));
      });
      vi.doUnmock("../server/middleware/auth");
    }
  });
});

describe("free open beta — billing routes", () => {
  let server: import("node:http").Server;
  let baseUrl: string;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv("FREE_BETA_ALL_ACCESS", "true");
    vi.stubEnv("PAYMENTS_ENABLED", "");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_beta");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_beta");

    vi.doMock("../server/middleware/auth", () => ({
      requireAuth: (req: any, _res: unknown, next: () => void) => {
        req.user = { id: "u_beta", email: "beta@test.com", profile: { tier: "free", id: "u_beta" } };
        next();
      },
      getSupabaseAdmin: vi.fn(),
      supabaseAdmin: { from: vi.fn() },
    }));

    const express = (await import("express")).default;
    const { requestContext } = await import("../server/middleware/requestContext");
    const { apiErrorHandler } = await import("../server/middleware/errorHandler");
    const { billingRoutes } = await import("../server/routes/billingRoutes");

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

  afterEach(async () => {
    vi.unstubAllEnvs();
    vi.doUnmock("../server/middleware/auth");
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("refuses checkout with a payments_disabled envelope even with Stripe keys present", async () => {
    const response = await fetch(`${baseUrl}/api/billing/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier: "pro", interval: "monthly" }),
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      ok: false,
      error: { code: "payments_disabled" },
    });
  });

  it("refuses the customer portal", async () => {
    const response = await fetch(`${baseUrl}/api/billing/portal`, { method: "POST" });

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      ok: false,
      error: { code: "payments_disabled" },
    });
  });

  it("acknowledges and drops Stripe webhooks instead of processing them", async () => {
    const response = await fetch(`${baseUrl}/api/billing/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "customer.subscription.deleted" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      received: true,
      processed: false,
      reason: "payments_disabled",
    });
  });

  it("reports the beta grant on status without a subscription lookup", async () => {
    const response = await fetch(`${baseUrl}/api/billing/status`);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      tier: "creator",
      status: "free_beta",
      freeBeta: true,
      paymentsEnabled: false,
      storedTier: "free",
      canUseProGraphs: true,
      subscription: null,
    });
  });
});

describe("free open beta — client gating", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("unlocks every tier-gated surface", async () => {
    vi.doMock("../src/lib/betaAccess", () => ({
      FREE_BETA_ALL_ACCESS: true,
      PAYMENTS_ENABLED: false,
      FREE_BETA_ENDS_AT: null,
      FREE_BETA_HEADLINE: "Free open beta",
      FREE_BETA_BLURB: "Everything unlocked.",
    }));

    const { hasTierAccess, isProUser } = await import("../src/components/pro/proAccessUtils");
    const basic = { subscriptionTier: "BASIC" as const };

    expect(hasTierAccess(basic, "GOLD")).toBe(true);
    expect(hasTierAccess(basic, "SELLER_PRO")).toBe(true);
    expect(isProUser(basic)).toBe(true);
  });

  it("opens every V.A.I room instead of the one-per-day rotation", async () => {
    vi.doMock("../src/lib/betaAccess", () => ({
      FREE_BETA_ALL_ACCESS: true,
      PAYMENTS_ENABLED: false,
      FREE_BETA_ENDS_AT: null,
      FREE_BETA_HEADLINE: "Free open beta",
      FREE_BETA_BLURB: "Everything unlocked.",
    }));

    const { getVaiEntitlements } = await import("../src/lib/vai/vaiEntitlements");
    const result = getVaiEntitlements({ tier: "free", dateKey: "2026-08-07" });

    expect(result.canSeeAllPersonas).toBe(true);
    expect(result.allowedPersonaIds).toHaveLength(4);
  });

  it("refuses checkout and the billing portal without a network call", async () => {
    vi.doMock("../src/lib/betaAccess", () => ({
      FREE_BETA_ALL_ACCESS: true,
      PAYMENTS_ENABLED: false,
      FREE_BETA_ENDS_AT: null,
      FREE_BETA_HEADLINE: "Free open beta",
      FREE_BETA_BLURB: "Everything unlocked.",
    }));

    const post = vi.fn();
    const get = vi.fn();
    vi.doMock("../src/lib/apiClient", () => ({ apiClient: { post, get } }));

    const { startStripeCheckout, openBillingPortal, fetchBillingStatus } = await import(
      "../src/lib/billingClient"
    );

    expect(await startStripeCheckout()).toMatchObject({ ok: false });
    expect(await openBillingPortal()).toMatchObject({ ok: false });
    expect(await fetchBillingStatus()).toMatchObject({
      tier: "creator",
      status: "free_beta",
      freeBeta: true,
    });
    expect(post).not.toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
  });
});
