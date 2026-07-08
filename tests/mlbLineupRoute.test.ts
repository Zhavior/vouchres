import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";

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
  getSharedDailyReport: vi.fn(async () => ({ vulnerablePitchers: [], warnings: [] })),
}));

vi.mock("../server/services/mlb/mlbHealthService", () => ({
  getMlbHealthReport: vi.fn(async () => ({ status: "ok" })),
}));

vi.mock("../server/lib/sports/sportsHttpClient", () => ({
  sportsFetchJson: vi.fn(async () => {
    throw new Error("statsapi timeout");
  }),
}));

import { registerMlbRoutes } from "../server/routes/mlbRoutes";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  registerMlbRoutes(app);
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

describe("mlb lineup routes", () => {
  it("returns unified 503 envelope when lineup upstream fails", async () => {
    const response = await fetch(`${baseUrl}/api/mlb/lineup/today`);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "external_service_error",
        message: "Lineup data unavailable",
      },
    });
  });
});
