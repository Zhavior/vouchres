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
  app.post("/api/ping", (_req, res) => res.json({ ok: true }));
  app.get("/api/ai/summary", (_req, res) => res.json({ ok: true }));

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

/**
 * Fail-closed is scoped to requests where unlimited access is actually costly.
 *
 * Previously this applied to every request, so a broken Upstash token took the
 * entire read API down with it (2026-08-05). Writes and AI reads still reject;
 * plain reads degrade to per-process limiting so cached data keeps serving.
 */
describe("rate limit redis fail-closed", () => {
  it("returns 503 for mutating requests when Upstash errors in production", async () => {
    const response = await fetch(`${baseUrl}/api/ping`, { method: "POST" });
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

  it("returns 503 for AI reads when Upstash errors in production", async () => {
    const response = await fetch(`${baseUrl}/api/ai/summary`);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({
      ok: false,
      error: { code: "upstream_unavailable" },
    });
  });

  it("keeps serving plain reads when Upstash errors instead of 503ing the API", async () => {
    const response = await fetch(`${baseUrl}/api/ping`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
  });

  it("still bounds plain reads with per-process counters during a Redis outage", async () => {
    let lastStatus = 0;
    let lastBody: any = null;

    for (let i = 0; i < 305; i += 1) {
      const response = await fetch(`${baseUrl}/api/ping`);
      lastStatus = response.status;
      lastBody = await response.json();
      if (lastStatus === 429) break;
    }

    expect(lastStatus).toBe(429);
    expect(lastBody).toMatchObject({
      ok: false,
      error: { code: "rate_limited" },
    });
  });
});
