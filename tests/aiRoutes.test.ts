import express from "express";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { AppError } from "../server/errors/AppError";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { requestContext } from "../server/middleware/requestContext";
import { registerAiRoutes } from "../server/routes/aiRoutes";

vi.mock("../server/middleware/auth", () => ({
  requireAuth: (req: any, _res: unknown, next: (err?: unknown) => void) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return next(new AppError({
        status: 401,
        code: "missing_token",
        message: "Authentication token is required.",
      }));
    }
    req.user = {
      id: "user_1",
      profile: {
        id: "user_1",
        username: "tester",
        tier: "free",
        is_banned: false,
        is_staff: false,
        is_demo: false,
        age_confirmed_at: null,
        jurisdiction_confirmed_at: null,
        jurisdiction: null,
      },
    };
    next();
  },
}));

vi.mock("../server/middleware/rateLimit", () => ({
  generationLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock("../server/middleware/entitlements", () => ({
  requireTierOrQuota: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  incrementQuota: vi.fn(async () => undefined),
}));

vi.mock("../server/services/ai/chatService", () => ({
  generateAiChatResponse: vi.fn(async () => ({
    status: "no-key",
    text: "Local guidance mode.",
  })),
}));

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(requestContext);
  app.use(express.json());
  registerAiRoutes(app);
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

describe("ai routes", () => {
  it("wires requireTierOrQuota on every Gemini-backed POST route", () => {
    const source = readFileSync(path.join(process.cwd(), "server/routes/aiRoutes.ts"), "utf8");
    const routeBlocks = source.match(/app\.post\(\s*\n?\s*"([^"]+)"/g) ?? [];
    const paths = routeBlocks.map((block) => block.match(/"([^"]+)"/)?.[1]).filter(Boolean);

    expect(paths.length).toBeGreaterThanOrEqual(8);
    for (const routePath of paths) {
      const start = source.indexOf(`"${routePath}"`);
      const slice = source.slice(start, start + 600);
      expect(slice, `${routePath} missing requireTierOrQuota`).toContain("requireTierOrQuota");
    }
    expect(source).toContain("incrementAiQuotaIfNeeded");
  });

  it("rejects unauthenticated chat requests", async () => {
    const response = await fetch(`${baseUrl}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "missing_token",
        message: "Authentication token is required.",
      },
    });
  });

  it("returns ok envelope with request meta for authenticated chat", async () => {
    const response = await fetch(`${baseUrl}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      status: "no-key",
      text: "Local guidance mode.",
      meta: {
        requestId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
  });
});
