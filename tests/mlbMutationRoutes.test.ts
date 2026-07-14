import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { requestContext } from "../server/middleware/requestContext";

vi.mock("../server/middleware/auth", () => ({
  requireAuth: (req: any, _res: unknown, next: () => void) => {
    req.user = { id: "user-mlb-mutation", profile: {} };
    next();
  },
}));

vi.mock("../server/services/mlb/mlbClient", () => ({
  todayISO: () => "2026-07-08",
  getTodayGames: vi.fn(async () => []),
  getScheduleByDate: vi.fn(async () => []),
  getGameFeed: vi.fn(async () => null),
  getProbablePitchers: vi.fn(async () => []),
}));

vi.mock("../server/services/mlb/liveGamesService", () => ({
  getLiveGames: vi.fn(async () => []),
}));

vi.mock("../server/services/intelligence/mlbIntelligenceEngine", () => ({
  getSharedDailyReport: vi.fn(async () => ({ warnings: [] })),
}));

vi.mock("../server/services/mlb/mlbHealthService", () => ({
  getMlbHealthReport: vi.fn(async () => ({ status: "ok" })),
}));

vi.mock("../server/services/mlb/parlayOddsFeedService", () => ({
  fetchLiveTierOddsBatch: vi.fn(async () => ({ tier_a: { odds: null, source: "tbd" } })),
}));

import { registerMlbRoutes } from "../server/routes/mlbRoutes";
import { resetRateLimitMemoryForTests } from "../server/middleware/rateLimit";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

  const app = express();
  app.use(requestContext);
  app.use(express.json());
  registerMlbRoutes(app);
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
  vi.unstubAllEnvs();
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

describe("mlb mutation POST routes", () => {
  it("validates batch body shape", async () => {
    resetRateLimitMemoryForTests();
    const response = await fetch(`${baseUrl}/api/mlb/parlay-tier-odds/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "Aaron Judge", tiers: [] }),
    });
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error.code).toBe("validation_error");
  });

  it("accepts authenticated batch requests with bounded tiers", async () => {
    resetRateLimitMemoryForTests();
    const response = await fetch(`${baseUrl}/api/mlb/parlay-tier-odds/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerName: "Aaron Judge",
        teamName: "NYY",
        tiers: [{ key: "hr", marketCode: "ANYTIME_HR", statTarget: 1 }],
      }),
    });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.quotes).toBeTruthy();
  });
});
