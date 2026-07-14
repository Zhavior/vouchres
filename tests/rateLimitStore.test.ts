import express from "express";
import type { Server } from "node:http";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { requestContext } from "../server/middleware/requestContext";
import {
  clientIpKey,
  globalLimiter,
  resetRateLimitMemoryForTests,
} from "../server/middleware/rateLimit";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  // Match production: trust one proxy hop so spoofed leftmost XFF is ignored.
  app.set("trust proxy", 1);
  app.use(requestContext);
  app.use("/api", globalLimiter);
  app.get("/api/ping", (_req, res) => {
    res.json({ ok: true });
  });
  app.get("/api/whoami-ip", (req, res) => {
    res.json({ key: clientIpKey(req), ip: req.ip });
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

  it("does not invent a new bucket from spoofed leftmost X-Forwarded-For", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const a = await fetch(`${baseUrl}/api/whoami-ip`, {
      headers: { "X-Forwarded-For": "203.0.113.10, 127.0.0.1" },
    });
    const b = await fetch(`${baseUrl}/api/whoami-ip`, {
      headers: { "X-Forwarded-For": "198.51.100.20, 127.0.0.1" },
    });

    const bodyA = await a.json();
    const bodyB = await b.json();

    // With trust proxy=1, Express uses the rightmost untrusted client hop it trusts —
    // spoofed leftmost addresses must not diverge into separate keys from the same socket.
    expect(bodyA.key).toBe(bodyB.key);
    expect(bodyA.key).not.toContain("203.0.113.10");
    expect(bodyA.key).not.toContain("198.51.100.20");
  });
});
