import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../server/errors/AppError";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { apiNotFoundHandler } from "../server/middleware/apiNotFound";
import { requestContext } from "../server/middleware/requestContext";

const mocks = vi.hoisted(() => ({
  getLiveAtBat: vi.fn(),
}));

vi.mock("../server/services/mlb/liveAtBatService", () => ({
  getLiveAtBat: mocks.getLiveAtBat,
}));

let server: Server;
let baseUrl: string;

async function requestJson(path: string): Promise<{ status: number; body: any }> {
  const response = await fetch(`${baseUrl}${path}`);
  return {
    status: response.status,
    body: await response.json(),
  };
}

const snapshot = {
  gamePk: 1234,
  status: "In Progress",
  inning: 7,
  halfInning: "Top",
  outs: 1,
  away: { teamId: 111, abbr: "AWY", runs: 5 },
  home: { teamId: 222, abbr: "HOM", runs: 4 },
  winProb: null,
  play: {
    description: "Single to center",
    isComplete: true,
    batter: { id: 10, name: "Test Batter", headshot: null, gameLine: "2/4" },
    pitcher: { id: 20, name: "Test Pitcher", gameLine: "6.1 ip, 8 k, 3 er, 91 p" },
    pitches: [],
    hit: null,
  },
  updatedAt: "2026-07-08T22:00:00.000Z",
};

beforeAll(async () => {
  const { registerHrBoardRoutes } = await import("../server/routes/mlbHrBoardRoutes");
  const app = express();
  app.use(requestContext);
  registerHrBoardRoutes(app);
  app.use("/api", apiNotFoundHandler);
  app.use("/api", apiErrorHandler);

  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Test server did not bind to a TCP port.");
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

beforeEach(() => {
  mocks.getLiveAtBat.mockReset();
});

afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

describe("live at-bat API route", () => {
  it("returns a production envelope with official MLB feed metadata", async () => {
    mocks.getLiveAtBat.mockResolvedValue(snapshot);

    const response = await requestJson("/api/mlb/live-at-bat/1234");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      gamePk: snapshot.gamePk,
      status: snapshot.status,
      meta: {
        source: "live_game_hub",
        dataQuality: "official_mlb_live_feed",
        updatedAt: snapshot.updatedAt,
        warnings: [],
        cache: {
          strategy: "live_game_hub_swr",
          ttlMs: 4_500,
          asOf: snapshot.updatedAt,
        },
        requestId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
  });

  it("returns a standardized 404 when the live feed is unavailable", async () => {
    mocks.getLiveAtBat.mockResolvedValue(null);

    const response = await requestJson("/api/mlb/live-at-bat/1234");

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      ok: false,
      error: {
        code: "not_found",
        message: "Game feed unavailable.",
      },
    });
    expect(response.body.error.requestId).toEqual(expect.any(String));
  });

  it("does not leak upstream errors to the client", async () => {
    mocks.getLiveAtBat.mockRejectedValue(new AppError({
      status: 503,
      code: "external_service_error",
      message: "MLB feed timed out.",
      expose: false,
    }));

    const response = await requestJson("/api/mlb/live-at-bat/1234");

    expect(response.status).toBe(503);
    expect(response.body.error).toMatchObject({
      code: "external_service_error",
      message: "Internal server error.",
    });
  });
});
