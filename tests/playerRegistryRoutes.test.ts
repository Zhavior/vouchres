import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { requestContext } from "../server/middleware/requestContext";
import { playerRegistryRoutes } from "../server/routes/playerRegistryRoutes";

vi.mock("../server/services/mlb/playerRegistryService", () => ({
  getPlayerCount: vi.fn(async () => ({
    ready: true,
    stale: false,
    warming: false,
    source: "live_cache",
    count: 1248,
    updatedAt: "2026-08-05T00:00:00.000Z",
    attemptedAt: "2026-08-05T00:00:00.000Z",
    warning: null,
  })),
  getPlayerRegistryPayload: vi.fn(async () => ({
    ready: true,
    stale: false,
    warming: false,
    source: "live_cache",
    count: 1248,
    updatedAt: "2026-08-05T00:00:00.000Z",
    attemptedAt: "2026-08-05T00:00:00.000Z",
    warning: null,
    players: [],
  })),
  getPlayerRegistry: vi.fn(async () => []),
  getActivePlayers: vi.fn(async () => []),
  searchPlayers: vi.fn(async () => []),
  getPlayerById: vi.fn(async () => null),
  refreshPlayerRegistry: vi.fn(async () => ({
    ready: true,
    stale: false,
    warming: false,
    source: "live_cache",
    count: 0,
    updatedAt: "2026-08-05T00:00:00.000Z",
    attemptedAt: "2026-08-05T00:00:00.000Z",
    warning: null,
    players: [],
  })),
}));

vi.mock("../server/services/mlb/playerEdgeResearchService", () => ({
  getPlayerEdgeResearch: vi.fn(async () => ({ playerId: 592450, warnings: [] })),
}));

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(requestContext);
  app.use(express.json());
  app.use("/api", playerRegistryRoutes);
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

describe("player registry routes", () => {
  it("returns ok envelope with self-describing metadata for player count", async () => {
    const response = await fetch(`${baseUrl}/api/mlb/players/count`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      ready: true,
      stale: false,
      warming: false,
      source: "live_cache",
      count: 1248,
      updatedAt: "2026-08-05T00:00:00.000Z",
      attemptedAt: "2026-08-05T00:00:00.000Z",
      warning: null,
      meta: {
        requestId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
  });

  it("returns ok envelope with self-describing metadata and players array for registry", async () => {
    const response = await fetch(`${baseUrl}/api/mlb/players/registry`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      ready: true,
      stale: false,
      warming: false,
      source: "live_cache",
      count: 1248,
      updatedAt: "2026-08-05T00:00:00.000Z",
      attemptedAt: "2026-08-05T00:00:00.000Z",
      warning: null,
      players: [],
      meta: {
        requestId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
  });

  it("normalizes invalid playerId to validation_error", async () => {
    const response = await fetch(`${baseUrl}/api/mlb/players/not-a-player`);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "validation_error",
        message: "playerId must be a positive integer.",
        requestId: expect.any(String),
      },
    });
  });
});
