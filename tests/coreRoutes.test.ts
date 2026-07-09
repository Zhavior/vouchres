import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { requestContext } from "../server/middleware/requestContext";
import { coreRoutes } from "../server/routes/coreRoutes";

vi.mock("../server/middleware/auth", () => ({
  requireAuth: (req: any, _res: unknown, next: () => void) => {
    req.user = {
      id: "user-core-test",
      profile: { is_staff: false, age_confirmed_at: "2026-01-01", jurisdiction_confirmed_at: "2026-01-01", jurisdiction: "US" },
    };
    next();
  },
  requireStaff: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireLegalConfirmed: (_req: unknown, _res: unknown, next: () => void) => next(),
  getSupabaseAdmin: vi.fn(async () => ({
    from: () => ({
      update: () => ({ eq: async () => ({ error: null }) }),
    }),
  })),
}));

vi.mock("../server/middleware/entitlements", () => ({
  requireTierOrQuota: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  incrementQuota: vi.fn(async () => undefined),
}));

vi.mock("../server/services/persistence/betaService", () => ({
  joinWaitlist: vi.fn(async (email: string) => ({ state: "joined", email })),
}));

vi.mock("../server/services/persistence/pickService", () => ({
  createPick: vi.fn(async () => ({ id: "pick-1" })),
  getLedger: vi.fn(async () => ({ picks: [], total: 0 })),
  gradePick: vi.fn(async () => ({ id: "pick-1", status: "won" })),
}));

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(requestContext);
  app.use(express.json());
  app.use("/api", coreRoutes);
  app.use("/api", apiErrorHandler);

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
});

describe("core routes", () => {
  it("returns ok envelope for beta signup", async () => {
    const response = await fetch(`${baseUrl}/api/beta/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      state: "joined",
      meta: {
        requestId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
  });

  it("returns ok envelope for legal confirm", async () => {
    const response = await fetch(`${baseUrl}/api/legal/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ age_confirmed: true, jurisdiction: "US" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      meta: {
        requestId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
  });

  it("returns ok envelope for pick ledger", async () => {
    const response = await fetch(`${baseUrl}/api/picks`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      picks: [],
      total: 0,
      meta: {
        requestId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
  });
});
