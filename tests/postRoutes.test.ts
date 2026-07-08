import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { postRoutes } from "../server/routes/postRoutes";

const fromMock = vi.fn();

vi.mock("../server/middleware/auth", () => ({
  optionalAuth: (req: any, _res: unknown, next: () => void) => {
    req.user = undefined;
    next();
  },
  requireAuth: (req: any, _res: unknown, next: () => void) => {
    req.user = { id: "user_test", profile: { is_staff: false } };
    next();
  },
  supabaseAdmin: {
    from: (...args: unknown[]) => fromMock(...args),
    rpc: vi.fn(),
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
  app.use("/api", postRoutes);
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

describe("post routes", () => {
  it("returns discover feed with ok envelope", async () => {
    fromMock.mockReturnValueOnce({
      select: () => ({
        order: () => ({
          limit: async () => ({ data: [], error: null }),
        }),
      }),
    });

    const response = await fetch(`${baseUrl}/api/feed/discover`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, posts: [] });
  });

  it("returns unified not_found for missing posts", async () => {
    fromMock.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: { message: "missing" } }),
        }),
      }),
    });

    const response = await fetch(`${baseUrl}/api/posts/missing`);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "not_found",
        message: "Post not found.",
      },
    });
  });

  it("returns unified not_found when liking a missing post", async () => {
    fromMock.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
        }),
      }),
    });

    const response = await fetch(`${baseUrl}/api/posts/missing/like`, { method: "POST" });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "not_found",
        message: "Post not found.",
      },
    });
  });
});
