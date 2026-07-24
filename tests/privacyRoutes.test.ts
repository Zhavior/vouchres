import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { requestContext } from "../server/middleware/requestContext";
import { privacyRoutes } from "../server/routes/privacyRoutes";

const profile = {
  id: "user_test",
  username: "tester",
  deletion_scheduled_at: null as string | null,
  stripe_subscription_id: null as string | null,
};

const updateEq = vi.fn(async () => ({ error: null }));
const update = vi.fn(() => ({ eq: updateEq }));
const selectEq = vi.fn(async () => ({ data: [], error: null }));
const select = vi.fn(() => ({ eq: selectEq }));

const { attachUser, bumpAuthUserEpoch } = vi.hoisted(() => {
  const attachUser = (req: any, _res: unknown, next: () => void) => {
    req.user = { id: "user_test", profile };
    next();
  };
  return { attachUser, bumpAuthUserEpoch: vi.fn(async () => undefined) };
});

vi.mock("../server/middleware/auth", () => ({
  requireAuth: attachUser,
  requireAuthAllowPendingDeletion: attachUser,
  bumpAuthUserEpoch,
  supabaseAdmin: {
    from: vi.fn(() => ({ update, select })),
    rpc: vi.fn(),
  },
}));

import { supabaseAdmin } from "../server/middleware/auth";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(requestContext);
  app.use(express.json());
  app.use("/api/privacy", privacyRoutes);
  app.use("/api/privacy", apiErrorHandler);

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

describe("privacy routes", () => {
  it("requires explicit confirmation to schedule deletion", async () => {
    const response = await fetch(`${baseUrl}/api/privacy/delete-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "no" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "validation_error",
        message: "Request validation failed.",
      },
    });
    expect(body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "confirm" }),
      ]),
    );
  });

  it("returns unified envelope when canceling with no schedule", async () => {
    profile.deletion_scheduled_at = null;

    const response = await fetch(`${baseUrl}/api/privacy/cancel-deletion`, {
      method: "POST",
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "bad_request",
        message: "No account deletion is scheduled.",
      },
    });
  });

  it("exports account data with ok envelope", async () => {
    vi.mocked(supabaseAdmin.rpc).mockResolvedValueOnce({
      data: { profile: { id: "user_test" } },
      error: null,
    } as any);

    const response = await fetch(`${baseUrl}/api/privacy/export`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      data: { profile: { id: "user_test" } },
      meta: {
        requestId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
  });
});
