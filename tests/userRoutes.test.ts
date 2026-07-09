import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { userRoutes } from "../server/routes/userRoutes";

const fromMock = vi.fn();

vi.mock("../server/middleware/auth", () => ({
  optionalAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  supabaseAdmin: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/users", userRoutes);
  app.use("/api/users", apiErrorHandler);

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

describe("user routes", () => {
  it("returns available handle with ok envelope", async () => {
    fromMock.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    });

    const response = await fetch(`${baseUrl}/api/users/handle/fresh_handle`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      available: true,
      handle: "fresh_handle",
    });
  });

  it("rejects invalid handle format", async () => {
    const response = await fetch(`${baseUrl}/api/users/handle/_bad`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      available: false,
      reason: "invalid_format",
    });
  });

  it("reports taken handles", async () => {
    fromMock.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { id: "user_existing" }, error: null }),
        }),
      }),
    });

    const response = await fetch(`${baseUrl}/api/users/handle/taken_handle`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      available: false,
      handle: "taken_handle",
      reason: "taken",
    });
  });
});
