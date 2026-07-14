import express from "express";
import type { Server } from "node:http";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { requestContext } from "../server/middleware/requestContext";
import { globalLimiter, resetRateLimitMemoryForTests } from "../server/middleware/rateLimit";

vi.mock("../server/lib/upstashRedis", () => ({
  isUpstashEnabled: () => true,
  redisIncr: vi.fn(async () => {
    throw new Error("Upstash Redis 503");
  }),
}));

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");

  const app = express();
  app.set("trust proxy", 1);
  app.use(requestContext);
  app.use("/api", globalLimiter);
  app.get("/api/ping", (_req, res) => res.json({ ok: true }));

  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Test server did not bind.");
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

afterEach(() => {
  resetRateLimitMemoryForTests();
});

afterAll(async () => {
  vi.unstubAllEnvs();
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

describe("rate limit redis fail-closed", () => {
  it("returns 503 in production when Upstash errors instead of memory fallback", async () => {
    const response = await fetch(`${baseUrl}/api/ping`);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "upstream_unavailable",
        message: "Rate limiting temporarily unavailable. Try again shortly.",
      },
    });
  });
});
