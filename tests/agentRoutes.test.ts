import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { requestContext } from "../server/middleware/requestContext";
import { registerAgentRoutes } from "../server/routes/agentRoutes";

vi.mock("../server/middleware/auth", () => ({
  requireAuth: (req: any, _res: unknown, next: () => void) => {
    req.user = {
      id: "user_1",
      profile: { id: "user_1", tier: "gold", is_staff: false },
    };
    next();
  },
  requireStaff: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock("../server/middleware/entitlements", () => ({
  requireTierOrQuota: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  incrementQuota: vi.fn(async () => undefined),
}));

vi.mock("../server/agents/agentRegistry", () => ({
  listAgents: vi.fn(() => [{ id: "alpha", name: "Alpha", icon: "A" }]),
  getAgent: vi.fn((id: string) => (id === "alpha" ? { id: "alpha", name: "Alpha", icon: "A" } : null)),
  generatePicks: vi.fn(async () => [{ selection: "Player HR", confidence: 72 }]),
  JUDGE_AGENTS: [{ id: "judge", name: "Judge", checks: ["a"] }],
  CAPPER_AGENTS: [{ id: "alpha", name: "Alpha", personality: "x", pickStyle: "y", riskTolerance: "balanced" }],
}));

vi.mock("../server/services/agents/unifiedAgentCatalog", () => ({
  buildUnifiedAgentCatalog: vi.fn(() => ({
    total: 1,
    lanes: { ai_judge: 0, panel_judge: 0, capper: 1, brand: 0 },
    agents: [{ id: "alpha", name: "Alpha", lane: "capper", tagline: "x", specialty: "y", builtin: true }],
    notes: [],
  })),
}));

vi.mock("../server/services/intelligence/mlbIntelligenceEngine", () => ({
  getSharedDailyReport: vi.fn(),
}));

import { getSharedDailyReport } from "../server/services/intelligence/mlbIntelligenceEngine";
import { getAgent } from "../server/agents/agentRegistry";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(requestContext);
  app.use(express.json());
  registerAgentRoutes(app);
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

describe("agent routes", () => {
  it("lists agents with ok envelope", async () => {
    const response = await fetch(`${baseUrl}/api/agents`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      cappers: [{ id: "alpha" }],
      judges: [{ id: "judge" }],
      catalog: {
        total: expect.any(Number),
        agents: expect.any(Array),
      },
      meta: {
        requestId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
    expect(response.headers.get("x-request-id")).toBe(body.meta.requestId);
  });

  it("returns agent details with ok envelope", async () => {
    const response = await fetch(`${baseUrl}/api/agents/alpha`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      id: "alpha",
      name: "Alpha",
      meta: {
        requestId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
  });

  it("returns unified not_found envelope for unknown agents", async () => {
    vi.mocked(getAgent).mockReturnValueOnce(null);

    const response = await fetch(`${baseUrl}/api/agents/missing`);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "not_found",
        message: "Agent not found.",
      },
    });
  });

  it("normalizes MLB upstream failures on generate-picks", async () => {
    vi.mocked(getSharedDailyReport).mockRejectedValueOnce(new Error("schedule down"));

    const response = await fetch(`${baseUrl}/api/agents/alpha/generate-picks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: "2026-07-08" }),
    });
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "upstream_unavailable",
        message: "Failed to generate picks — MLB data unavailable.",
      },
    });
  });
});
