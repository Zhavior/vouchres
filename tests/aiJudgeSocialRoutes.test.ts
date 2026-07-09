import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { requestContext } from "../server/middleware/requestContext";
import { registerAiJudgeSocialRoutes } from "../server/routes/aiJudgeSocialRoutes";

vi.mock("../server/middleware/auth", () => ({
  requireAuth: (req: any, _res: unknown, next: () => void) => {
    req.user = { id: "staff_1", profile: { is_staff: true } };
    next();
  },
  requireStaff: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock("../server/services/aiJudges/socialDraftService", () => ({
  listJudges: vi.fn(() => [{ id: "judge-1", displayName: "Test Judge" }]),
  listDrafts: vi.fn(() => []),
  generateHrSocialDrafts: vi.fn(async () => ({ drafts: [], warnings: [] })),
  queueDraft: vi.fn(() => {
    throw new Error("Draft not found");
  }),
  mockPostDraft: vi.fn(),
}));

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(requestContext);
  app.use(express.json());
  registerAiJudgeSocialRoutes(app);
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

describe("ai judge social routes", () => {
  it("returns ok envelope with request metadata for judges list", async () => {
    const response = await fetch(`${baseUrl}/api/ai-judge-social/judges`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      status: "ready",
      mode: "safe_prototype",
      judges: [{ id: "judge-1", displayName: "Test Judge" }],
      meta: {
        requestId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
  });

  it("returns unified not_found envelope when queueing a missing draft", async () => {
    const response = await fetch(`${baseUrl}/api/ai-judge-social/drafts/missing-draft/queue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "not_found",
        message: "Draft not found",
        requestId: expect.any(String),
      },
    });
  });
});
