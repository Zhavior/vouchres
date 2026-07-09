import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { requestContext } from "../server/middleware/requestContext";
import { registerJudgeRoutes } from "../server/routes/judgeRoutes";

vi.mock("../server/middleware/auth", () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock("../server/middleware/rateLimit", () => ({
  gradingLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock("../server/services/judging/trustJudgeService", () => ({
  runJudgePanel: vi.fn(() => ({
    quality: 8,
    risk: 3,
    bias: 1,
    trust: 7,
    verdict: "pass",
  })),
}));

vi.mock("../server/services/judging/biasJudgeService", () => ({
  judgeBias: vi.fn(() => ({ score: 0.1, flags: [] })),
}));

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(requestContext);
  app.use(express.json());
  registerJudgeRoutes(app);
  app.use(apiErrorHandler);

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

describe("judge routes", () => {
  it("returns ok envelope for pick judge", async () => {
    const response = await fetch(`${baseUrl}/api/judge/pick`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pick: { market: "ML", selection: "HOME" } }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      verdict: { verdict: "pass" },
      meta: {
        requestId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
    expect(response.headers.get("x-request-id")).toBe(body.meta.requestId);
  });

  it("rejects missing pick with unified validation envelope", async () => {
    const response = await fetch(`${baseUrl}/api/judge/pick`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "validation_error",
        message: "pick is required.",
      },
    });
  });
});
