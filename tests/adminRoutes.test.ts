import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { requestContext } from "../server/middleware/requestContext";
import { adminRoutes } from "../server/routes/adminRoutes";

const fromMock = vi.fn();

vi.mock("../server/middleware/auth", () => ({
  requireAuth: (req: any, _res: unknown, next: () => void) => {
    req.user = { id: "staff_1", profile: { is_staff: true } };
    next();
  },
  requireStaff: (_req: unknown, _res: unknown, next: () => void) => next(),
  supabaseAdmin: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

vi.mock("../server/middleware/validation", () => ({
  validate: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock("../server/services/persistence/betaService", () => ({
  issueInvite: vi.fn(async () => null),
}));

vi.mock("../server/services/hubs/hrBoardHub", () => ({
  getCachedValidatedHrBoard: vi.fn(async () => ({
    date: "2026-08-12",
    generatedAt: "2026-08-12T12:00:00.000Z",
    candidates: [{
      playerName: "Test Hitter",
      team: "TST",
      opponent: "OPP",
      gamePk: 123,
      hrScore: 88,
      estimatedHrProbability: 0.12,
      riskTier: "Playable",
      dataConfidence: 0.74,
      lineupStatus: "projected",
      dataQuality: "partial",
      reasons: ["Power profile"],
      warnings: [],
    }],
  })),
}));

vi.mock("../server/services/intelligence/centralBrain/hrPairedEvaluationService", () => ({
  evaluatePairedHrHistory: vi.fn(async () => ({
    status: "INSUFFICIENT_DATA",
    promotionEligible: false,
    incumbentModelVersions: [],
    challengerModelVersions: [],
    pairedObservations: 0,
    positiveOutcomes: 0,
    dropped: { missingOutcome: 0, temporalLeakage: 0, invalidPrediction: 0 },
    incumbent: { samples: 0, positives: 0, brierScore: 0, logLoss: 0, calibration: [] },
    challenger: { samples: 0, positives: 0, brierScore: 0, logLoss: 0, calibration: [] },
    brierImprovement: 0,
    reasons: ["Need more paired observations."],
  })),
}));

import { issueInvite } from "../server/services/persistence/betaService";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(requestContext);
  app.use(express.json());
  app.use("/api/admin", adminRoutes);
  app.use("/api/admin", apiErrorHandler);

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

describe("admin routes", () => {
  it("returns unified bad_request when invite target is unavailable", async () => {
    vi.mocked(issueInvite).mockResolvedValueOnce(null);

    const response = await fetch(`${baseUrl}/api/admin/beta/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "bad_request",
        message: "Email is not in the waitlist or was already invited.",
      },
    });
  });

  it("returns ok envelope for beta waitlist list", async () => {
    fromMock.mockReturnValueOnce({
      select: () => ({
        order: () => ({
          range: async () => ({ data: [], count: 0, error: null }),
        }),
      }),
    });

    const response = await fetch(`${baseUrl}/api/admin/beta`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      signups: [],
      total: 0,
      limit: 100,
      offset: 0,
      meta: {
        requestId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
  });

  it("blocks self demotion with unified bad_request", async () => {
    const response = await fetch(`${baseUrl}/api/admin/users/staff_1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_staff: false }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "bad_request",
        message: "You cannot demote yourself.",
      },
    });
  });

  it("returns a staff-only HR redesign preview without routing V2 to production", async () => {
    const response = await fetch(`${baseUrl}/api/admin/hr-research`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      mode: "admin_preview",
      publicImpact: "none",
      production: {
        notProductionRouted: true,
        totalCandidates: 1,
        topCandidates: [{ playerName: "Test Hitter", hrScore: 88 }],
      },
      v2: {
        status: "INSUFFICIENT_DATA",
        pairedObservations: 0,
        promotionEligible: false,
      },
      redesign: { version: "admin-only-prototype" },
    });
  });
});
