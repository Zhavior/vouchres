import express from "express";
import type { Server } from "node:http";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { requestContext } from "../server/middleware/requestContext";
import { globalLimiter, resetRateLimitMemoryForTests } from "../server/middleware/rateLimit";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(requestContext);
  app.use("/api", globalLimiter);
  app.get("/api/ping", (_req, res) => {
    res.json({ ok: true });
  });

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
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

describe("rate limit envelope", () => {
  it("returns unified 429 envelope with request id", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    let lastStatus = 0;
    let lastBody: any = null;

    for (let i = 0; i < 205; i += 1) {
      const response = await fetch(`${baseUrl}/api/ping`);
      lastStatus = response.status;
      lastBody = await response.json();
      if (lastStatus === 429) break;
    }

    expect(lastStatus).toBe(429);
    expect(lastBody).toMatchObject({
      ok: false,
      error: {
        code: "rate_limited",
        requestId: expect.any(String),
      },
    });
  });
});
