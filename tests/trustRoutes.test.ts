import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { registerTrustRoutes } from "../server/routes/trustRoutes";

vi.mock("../server/services/trust/trustScoreService", () => ({
  getUserTrust: vi.fn((userId: string) => ({
    userId,
    userTrustScore: 72,
    capperTrustBadge: "High Trust",
    recentForm: "W-W-L",
    bestMarket: "ANYTIME_HR",
    transparencyBadge: "Verified Ledger",
    verifiedRecordSummary: { wins: 4, losses: 1, pushes: 0, total: 5, winRate: 80 },
  })),
  getCapperTrust: vi.fn((capperId: string) => ({
    userId: capperId,
    userTrustScore: 88,
    capperTrustBadge: "Elite Verified",
    recentForm: "W-W-W",
    bestMarket: "ML",
    transparencyBadge: "Verified Ledger",
    verifiedRecordSummary: { wins: 10, losses: 1, pushes: 0, total: 11, winRate: 91 },
  })),
}));

vi.mock("../server/services/trust/verifiedRecordService", () => ({
  getVerifiedRecord: vi.fn((capperId: string) => ({
    subjectId: capperId,
    badge: "Elite Verified",
    trustScore: 88,
    record: "10-1-0",
    winRate: 91,
    recentForm: "W-W-W",
    bestMarket: "ML",
    transparencyBadge: "Verified Ledger",
    recentPicks: [],
  })),
}));

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  registerTrustRoutes(app);
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

describe("trust routes", () => {
  it("returns ok envelope for user trust", async () => {
    const response = await fetch(`${baseUrl}/api/trust/user/user-1`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      trust: {
        userTrustScore: 72,
        capperTrustBadge: "High Trust",
      },
    });
  });

  it("returns ok envelope for capper trust + verified record", async () => {
    const response = await fetch(`${baseUrl}/api/trust/capper/capper-1`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      trust: { userTrustScore: 88 },
      verifiedRecord: { record: "10-1-0", trustScore: 88 },
    });
  });

  it("rejects empty user id with unified validation envelope", async () => {
    const response = await fetch(`${baseUrl}/api/trust/user/%20`);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "validation_error",
        message: "userId is required.",
      },
    });
  });
});
