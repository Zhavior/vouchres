import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { publicRoutes } from "../server/routes/publicRoutes";

const fromMock = vi.fn();

vi.mock("../server/middleware/auth", () => ({
  requireAuth: (req: any, _res: unknown, next: () => void) => {
    req.user = { id: "user_test", profile: { is_staff: false } };
    next();
  },
  requireStaff: (_req: unknown, _res: unknown, next: () => void) => next(),
  optionalAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  supabaseAdmin: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

vi.mock("../server/services/aiJudges/aiJudgeLeaderboardService", () => ({
  buildAiJudgeLeaderboard: vi.fn(async () => ({ entries: [] })),
}));

vi.mock("../server/services/aiJudges/agentRegistry", () => ({
  listAgentMeta: vi.fn(() => [
    {
      id: "data_scout",
      displayName: "Data Scout",
      handle: "ai-data-scout",
      tagline: "Clean math.",
      persona: "Test",
      specialty: "Math",
      color: "cyan",
      code: "DS",
      builtin: true,
      singlePickLimit: 1,
    },
  ]),
  getAgent: vi.fn(),
  EXTENSION_DOCS_PATH: "server/services/aiJudges/agentRegistry.ts",
}));

vi.mock("../server/middleware/rateLimit", () => ({
  generationLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api", publicRoutes);
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

describe("public routes", () => {
  it("returns empty leaderboard with ok envelope", async () => {
    fromMock.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          in: () => ({
            gte: () => ({
              order: () => ({
                limit: async () => ({ data: [], error: null }),
              }),
            }),
          }),
        }),
      }),
    });

    const response = await fetch(`${baseUrl}/api/leaderboard`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, entries: [] });
  });

  it("returns unified not_found when capper is missing", async () => {
    fromMock.mockReturnValueOnce({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: { message: "missing" } }),
        }),
      }),
    });

    const response = await fetch(`${baseUrl}/api/cappers/missing`);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "not_found",
        message: "Capper not found.",
      },
    });
  });

  it("returns ai judge registry metadata", async () => {
    const response = await fetch(`${baseUrl}/api/ai-judges/registry`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.agents).toHaveLength(1);
    expect(body.agents[0].id).toBe("data_scout");
    expect(body.extensionDocs).toContain("agentRegistry");
  });

  it("rejects self-follow with unified bad_request envelope", async () => {
    const response = await fetch(`${baseUrl}/api/follow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ following_profile_id: "user_test" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "bad_request",
        message: "You cannot follow yourself.",
      },
    });
  });
});
