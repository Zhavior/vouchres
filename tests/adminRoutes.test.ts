import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { requestContext } from "../server/middleware/requestContext";
import { adminRoutes } from "../server/routes/adminRoutes";

const fromMock = vi.fn();

vi.mock("../server/middleware/auth", () => ({
  requireAuth: (req: any, _res: unknown, next: () => void) => {
    req.user = { id: "staff_1", profile: { is_staff: true } };
    next();
  },
  requireStaff: (_req: unknown, _res: unknown, next: () => void) => next(),
  supabaseAdmin: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

vi.mock("../server/middleware/validation", () => ({
  validate: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock("../server/services/persistence/betaService", () => ({
  issueInvite: vi.fn(async () => null),
}));

import { issueInvite } from "../server/services/persistence/betaService";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(requestContext);
  app.use(express.json());
  app.use("/api/admin", adminRoutes);
  app.use("/api/admin", apiErrorHandler);

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

describe("admin routes", () => {
  it("returns unified bad_request when invite target is unavailable", async () => {
    vi.mocked(issueInvite).mockResolvedValueOnce(null);

    const response = await fetch(`${baseUrl}/api/admin/beta/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "bad_request",
        message: "Email is not in the waitlist or was already invited.",
      },
    });
  });

  it("returns ok envelope for beta waitlist list", async () => {
    fromMock.mockReturnValueOnce({
      select: () => ({
        order: () => ({
          range: async () => ({ data: [], count: 0, error: null }),
        }),
      }),
    });

    const response = await fetch(`${baseUrl}/api/admin/beta`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      signups: [],
      total: 0,
      limit: 100,
      offset: 0,
      meta: {
        requestId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
  });

  it("blocks self demotion with unified bad_request", async () => {
    const response = await fetch(`${baseUrl}/api/admin/users/staff_1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_staff: false }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "bad_request",
        message: "You cannot demote yourself.",
      },
    });
  });
});
