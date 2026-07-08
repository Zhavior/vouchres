import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { authRoutes } from "../server/routes/authRoutes";

const fromMock = vi.fn();

vi.mock("../server/middleware/auth", () => ({
  requireAuth: (req: any, _res: unknown, next: () => void) => {
    req.user = {
      id: "user_test",
      profile: { id: "user_test", username: "tester", display_name: "Tester" },
    };
    next();
  },
  optionalAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  supabaseAdmin: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

vi.mock("../server/middleware/validation", () => ({
  validate: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api/auth", apiErrorHandler);

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

describe("auth routes", () => {
  it("returns current profile with ok envelope", async () => {
    const response = await fetch(`${baseUrl}/api/auth/me`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      id: "user_test",
      username: "tester",
    });
  });

  it("rejects empty profile updates with unified bad_request", async () => {
    const response = await fetch(`${baseUrl}/api/auth/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "bad_request",
        message: "No updates provided.",
      },
    });
  });

  it("checks username availability with ok envelope", async () => {
    fromMock.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    });

    const response = await fetch(`${baseUrl}/api/auth/username-check?username=freshname`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, available: true });
  });
});
