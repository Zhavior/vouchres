import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { requestContext } from "../server/middleware/requestContext";
import { registerMlbRoutes } from "../server/routes/mlbRoutes";

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

let server: Server;
let baseUrl: string;

beforeAll(async () => {
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
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

describe("mlb mutation auth gate", () => {
  it("returns 401 for unauthenticated parlay tier odds batch", async () => {
    const response = await fetch(`${baseUrl}/api/mlb/parlay-tier-odds/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerName: "Aaron Judge",
        tiers: [{ key: "hr", marketCode: "ANYTIME_HR", statTarget: 1 }],
      }),
    });

    expect(response.status).toBe(401);
  });
});
