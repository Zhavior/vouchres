import express from "express";
import type { Server } from "node:http";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { requestContext } from "../server/middleware/requestContext";
import { globalLimiter, resetRateLimitMemoryForTests } from "../server/middleware/rateLimit";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.set("trust proxy", 1);
  app.use(requestContext);
  app.use("/api", globalLimiter);
  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.get("/api/health/ready", (_req, res) => res.json({ ok: true }));
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
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

describe("globalLimiter health skip", () => {
  it("does not rate-limit public liveness probes mounted under /api", async () => {
    for (let i = 0; i < 210; i += 1) {
      const response = await fetch(`${baseUrl}/api/health`);
      expect(response.status).toBe(200);
    }
  });
});
