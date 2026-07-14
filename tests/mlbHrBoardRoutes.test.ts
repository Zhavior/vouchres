import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { requestContext } from "../server/middleware/requestContext";
import { registerHrBoardRoutes } from "../server/routes/mlbHrBoardRoutes";

const sampleBoard = {
  date: "2026-07-09",
  gameCount: 2,
  candidates: [
    {
      playerId: 592450,
      playerName: "Aaron Judge",
      team: "NYY",
      gamePk: 777001,
      hrScore: 88,
      lineupStatus: "confirmed",
      dataQuality: "confirmed",
      warnings: [],
    },
  ],
  projectedCandidates: [],
  allProjectedCandidates: [],
  pool: {
    totalPlayersChecked: 26,
    confirmedStarters: 1,
    projectedStarters: 0,
    benchOrUnknown: 0,
    injuredScratchedBlocked: 0,
    hrCandidatesScored: 1,
  },
  debug: {
    staleDataWarnings: [],
    lastRefresh: "2026-07-09T12:00:00.000Z",
  },
  generatedAt: "2026-07-09T12:00:00.000Z",
  dataQuality: "confirmed",
};

vi.mock("../server/services/hubs/hrBoardHub", () => ({
  getCachedValidatedHrBoard: vi.fn(async () => ({
    ...sampleBoard,
    servedFromLastGood: false,
    lastGoodWarnings: [],
  })),
  getCachedDeepHrBoard: vi.fn(),
}));

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(requestContext);
  app.use(express.json());
  registerHrBoardRoutes(app);
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

describe("mlb hr board routes", () => {
  it("returns ok envelope with request meta for GET /api/mlb/hr-board/today", async () => {
    const response = await fetch(`${baseUrl}/api/mlb/hr-board/today?previewLimit=50`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      date: "2026-07-09",
      gameCount: 2,
      dataQuality: "confirmed",
      meta: {
        requestId: expect.any(String),
        timestamp: expect.any(String),
        source: "validated_hr_board_pipeline",
        dataQuality: "validated_hr_board",
        cache: {
          strategy: "hr_board_hub_ttl",
          ttlMs: 900_000,
        },
      },
    });
    expect(Array.isArray(body.rows)).toBe(true);
    expect(Array.isArray(body.candidates)).toBe(true);
    expect(body.candidates).toEqual(body.confirmedCandidates);
    expect(response.headers.get("x-request-id")).toBe(body.meta.requestId);
  });

  it("walls off deep board so it cannot claim confirmed candidates", async () => {
    const { getCachedDeepHrBoard } = await import("../server/services/hubs/hrBoardHub");
    (getCachedDeepHrBoard as any).mockResolvedValueOnce({
      date: "2026-07-09",
      games: [{ rows: [{ playerName: "Deep Only" }] }],
      dataQuality: "partial",
    });

    const response = await fetch(`${baseUrl}/api/mlb/hr-board/today/deep`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.candidates).toEqual([]);
    expect(body.confirmedCandidates).toEqual([]);
    expect(body.isConfirmedBoard).toBe(false);
    expect(body.confirmedSource).toBe("/api/mlb/hr-board/today");
    expect(String(body.warning)).toMatch(/research-only/i);
  });

  it("propagates inbound x-request-id through requestContext", async () => {
    const inboundId = "req_hr_board_contract_test";
    const response = await fetch(`${baseUrl}/api/mlb/hr-board/today`, {
      headers: { "x-request-id": inboundId },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.meta.requestId).toBe(inboundId);
    expect(response.headers.get("x-request-id")).toBe(inboundId);
  });

  it("returns ok flat envelope for GET /api/mlb/hr-board/player/:playerId", async () => {
    const response = await fetch(`${baseUrl}/api/mlb/hr-board/player/592450`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      player: expect.objectContaining({
        playerId: 592450,
        playerName: "Aaron Judge",
      }),
      meta: {
        requestId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
  });
});
