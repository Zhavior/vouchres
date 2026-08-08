import express from "express";
import type { Server } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("rate limit local block cache", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("serves repeat 429s locally for the remainder of the Redis window", async () => {
    const rateLimitHit = vi
      .fn()
      .mockResolvedValueOnce({ count: 1, ttlSeconds: 60 })
      .mockResolvedValueOnce({ count: 2, ttlSeconds: 60 })
      .mockResolvedValueOnce({ count: 3, ttlSeconds: 60 });
    const incr = vi.fn();

    vi.doMock("../server/platform/dependency", () => ({
      getTitanDependencies: () => ({
        redis: {
          isEnabled: () => true,
          rateLimitHit,
          incr,
        },
      }),
    }));

    const { requestContext } = await import("../server/middleware/requestContext");
    const { rateLimit, resetRateLimitMemoryForTests } = await import("../server/middleware/rateLimit");

    const app = express();
    app.use(requestContext);
    app.use(rateLimit({ windowMs: 60_000, max: 2, keyPrefix: "rl:test" }));
    app.get("/ping", (_req, res) => res.json({ ok: true }));

    let server: Server | undefined;
    let baseUrl = "";
    try {
      await new Promise<void>((resolve) => {
        server = app.listen(0, "127.0.0.1", () => {
          const address = server!.address();
          if (!address || typeof address === "string") throw new Error("Test server did not bind.");
          baseUrl = `http://127.0.0.1:${address.port}`;
          resolve();
        });
      });

      expect((await fetch(`${baseUrl}/ping`)).status).toBe(200);
      expect((await fetch(`${baseUrl}/ping`)).status).toBe(200);
      expect((await fetch(`${baseUrl}/ping`)).status).toBe(429);
      expect((await fetch(`${baseUrl}/ping`)).status).toBe(429);

      expect(rateLimitHit).toHaveBeenCalledTimes(3);
      expect(incr).not.toHaveBeenCalled();
    } finally {
      resetRateLimitMemoryForTests();
      if (server) {
        await new Promise<void>((resolve, reject) => {
          server!.close((error) => (error ? reject(error) : resolve()));
        });
      }
    }
  });
});
