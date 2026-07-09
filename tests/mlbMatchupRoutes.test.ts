import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { requestContext } from "../server/middleware/requestContext";
import { registerMatchupRoutes } from "../server/routes/mlbMatchupRoutes";

vi.mock("../server/services/mlb/mlbClient", () => ({
  getScheduleByDate: vi.fn(async () => [
    {
      gamePk: 777001,
      status: "In Progress",
      inning: 5,
      linescore: { inningState: "Top" },
      score: { home: 2, away: 1 },
    },
  ]),
  todayISO: vi.fn(() => "2026-07-09"),
}));

vi.mock("../server/services/hubs/sportsTruthHub", () => ({
  buildSportsTruthSnapshot: vi.fn(async () => ({
    matchups: [{ gamePk: 777001 }],
    matchupMatrix: { rows: [] },
    generatedAt: "2026-07-09T12:00:00.000Z",
  })),
}));

vi.mock("../server/services/mlb/gameMatchupService", () => ({
  getGameMatchup: vi.fn(async () => ({ gamePk: 777001, teams: [] })),
  getMatchupMatrix: vi.fn(async () => ({ rows: [], date: "2026-07-09" })),
}));

vi.mock("../server/services/mlb/pitcherMatchupService", () => ({
  getPitcherMatchup: vi.fn(async () => ({ pitcherId: 123, edges: [] })),
}));

vi.mock("../server/services/mlb/weatherService", () => ({
  getTodayGamesWeather: vi.fn(async () => [{ gamePk: 777001, tempF: 72 }]),
}));

vi.mock("../server/services/mlb/statcastClient", () => ({
  getStatcastBatterMap: vi.fn(async () => ({ 592450: { pa: 200 } })),
  STATCAST_MIN_PA: 50,
}));

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(requestContext);
  app.use(express.json());
  registerMatchupRoutes(app);
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

describe("mlb matchup routes", () => {
  it("returns ok envelope for today scores", async () => {
    const response = await fetch(`${baseUrl}/api/mlb/scores/today`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      scores: expect.any(Array),
      updatedAt: expect.any(String),
      meta: expect.objectContaining({
        source: "mlb_statsapi_schedule_linescore",
      }),
    });
  });

  it("returns ok envelope for today matchups", async () => {
    const response = await fetch(`${baseUrl}/api/mlb/matchups/today`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      count: 1,
      matchups: [{ gamePk: 777001 }],
      meta: expect.objectContaining({
        source: "sports_truth_hub",
      }),
    });
  });

  it("returns ok envelope for weather today", async () => {
    const response = await fetch(`${baseUrl}/api/mlb/weather/today`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      weather: expect.any(Array),
      source: "open-meteo",
    });
  });
});
