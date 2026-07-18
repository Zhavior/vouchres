import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { requestContext } from "../server/middleware/requestContext";

vi.mock("../server/middleware/auth", () => ({
  requireAuth: (req: any, _res: unknown, next: () => void) => {
    req.user = { id: "user_1" };
    next();
  },
}));
vi.mock("../server/lib/cronAuth", () => ({ assertCronAuthorized: vi.fn() }));
vi.mock("../server/middleware/entitlements", () => ({ requireTier: vi.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()) }));

vi.mock("../server/services/intelligence/centralBrain/centralBrainService", () => ({
  listCentralBrainSports: vi.fn(() => [
    { sport: "mlb", available: true, engineVersion: "mlb-daily-report@1" },
    { sport: "nba", available: false, engineVersion: null },
    { sport: "nfl", available: false, engineVersion: null },
  ]),
  getDailyMlbCentralBrain: vi.fn(async (date?: string) => ({
    schemaVersion: "1.0",
    sport: "mlb",
    scope: `daily:${date ?? "today"}`,
    decisions: [],
  })),
}));

vi.mock("../server/services/intelligence/centralBrain/brainLedgerService", () => ({
  snapshotDailyBrainHrPicks: vi.fn(async () => undefined),
  snapshotDailyBrainStolenBasePicks: vi.fn(async () => undefined),
  snapshotDailyBrainPitcherKPicks: vi.fn(async () => undefined),
  settleBrainHrPicks: vi.fn(async () => 2),
  settleBrainStolenBasePicks: vi.fn(async () => 1),
  settleBrainPitcherKPicks: vi.fn(async () => 1),
  getBrainHrLedger: vi.fn(async () => ({
    picks: [{ decisionKey: "decision_1", result: "hit" }],
    performance: { total: 1, resolved: 1, pending: 0, hits: 1, misses: 0, voids: 0, hitRate: 100, sampleWarning: "Small sample: fewer than 30 resolved picks." },
  })),
  getBrainStolenBaseLedger: vi.fn(async () => ({
    picks: [], performance: { total: 0, resolved: 0, pending: 0, hits: 0, misses: 0, voids: 0, hitRate: null, sampleWarning: "Small sample" },
  })),
  getBrainPitcherKLedger: vi.fn(async () => ({
    picks: [{ decisionKey: "k_1", playerId: "99", playerName: "Starter", result: "pending" }],
    performance: { total: 1, resolved: 0, pending: 1, hits: 0, misses: 0, voids: 0, hitRate: null, sampleWarning: "Small sample" },
  })),
  getBrainMlbPicksForDate: vi.fn(async () => ({
    picks: [{ decisionKey: "decision_1", playerId: "1", playerName: "Slugger", result: "pending", score: 88, rank: 1 }],
    performance: { total: 1, resolved: 0, pending: 1, hits: 0, misses: 0, voids: 0, hitRate: null, sampleWarning: "Live selection" },
    stolenBase: { picks: [], performance: { total: 0, resolved: 0, pending: 0, hits: 0, misses: 0, voids: 0, hitRate: null, sampleWarning: null } },
    pitcherStrikeouts: {
      picks: [{ decisionKey: "k_1", playerId: "99", playerName: "Starter", result: "pending" }],
      performance: { total: 1, resolved: 0, pending: 1, hits: 0, misses: 0, voids: 0, hitRate: null, sampleWarning: "Small sample" },
    },
    provenance: { home_run: "live_selection", stolen_base: "live_selection", pitcher_strikeouts: "ledger" },
    engineVersions: {
      home_run: "brain-hr-selection@2",
      stolen_base: "brain-stolen-base-selection@1",
      pitcher_strikeouts: "brain-pitcher-k-selection@1",
    },
    doors: {
      schedule: { key: "schedule", label: "Schedule", source: "MLB Stats API schedule" },
    },
  })),
}));

vi.mock("../server/services/intelligence/centralBrain/brainScanService", () => ({
  scanMlbSlate: vi.fn(async () => ({ schemaVersion: "1.0", sport: "mlb", coverage: { games: 15, playersScanned: 180 }, sources: [], warnings: [] })),
}));
vi.mock("../server/services/intelligence/centralBrain/brainOperationsService", () => ({
  executeBrainOperations: vi.fn(async () => ({ date: "2026-07-12", upcomingGames: 2, snapshotAttempted: true, settled: 3 })),
}));
vi.mock("../server/services/intelligence/centralBrain/brainLearningService", () => ({
  evaluateBrainHrHistory: vi.fn(async () => [{ engineVersion: "brain-hr-selection@2", samples: 0, evaluation: null, readyForJudgment: false }]),
}));
vi.mock("../server/services/intelligence/centralBrain/brainGeminiReviewService", () => ({
  getBrainGeminiReviews: vi.fn(async () => ({ home_run: { status: "live", reviews: [] } })),
}));

import { registerCentralBrainRoutes } from "../server/routes/centralBrainRoutes";
import { getDailyMlbCentralBrain } from "../server/services/intelligence/centralBrain/centralBrainService";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(requestContext);
  registerCentralBrainRoutes(app);
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
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe("central brain routes", () => {
  it("reports supported sports without pretending unavailable adapters work", async () => {
    const response = await fetch(`${baseUrl}/api/intelligence/brain`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      identity: { productName: "ProjectVABrAIns", role: "sports_intelligence_brain" },
      sports: [
        { sport: "mlb", available: true },
        { sport: "nba", available: false },
        { sport: "nfl", available: false },
      ],
      meta: { requestId: expect.any(String) },
    });
  });

  it("passes a valid date to the shared MLB snapshot", async () => {
    const response = await fetch(`${baseUrl}/api/intelligence/brain/mlb/daily?date=2026-07-12`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getDailyMlbCentralBrain).toHaveBeenCalledWith("2026-07-12");
    expect(body.snapshot).toMatchObject({ sport: "mlb", scope: "daily:2026-07-12" });
  });

  it("rejects malformed dates with the standard error envelope", async () => {
    const response = await fetch(`${baseUrl}/api/intelligence/brain/mlb/daily?date=07-12-2026`);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      error: { code: "validation_error", message: "date must use YYYY-MM-DD format." },
    });
  });

  it("returns the immutable Brain ledger and calculated performance", async () => {
    const response = await fetch(`${baseUrl}/api/intelligence/brain/mlb/performance?date=2026-07-12`);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      picks: [{ decisionKey: "decision_1", result: "hit" }],
      performance: { total: 1, resolved: 1, hits: 1, hitRate: 100 },
      modelRecords: [{ engineVersion: "brain-hr-selection@2", samples: 0 }],
      pitcherStrikeouts: { performance: { total: 1, pending: 1 } },
      meta: { requestId: expect.any(String) },
    });
  });

  it("serves Brain Picks from live server selection without writing snapshots", async () => {
    const ledger = await import("../server/services/intelligence/centralBrain/brainLedgerService");
    const response = await fetch(`${baseUrl}/api/intelligence/brain/mlb/picks?date=2026-07-12`);
    expect(response.status).toBe(200);
    expect(ledger.snapshotDailyBrainHrPicks).not.toHaveBeenCalled();
    expect(ledger.snapshotDailyBrainStolenBasePicks).not.toHaveBeenCalled();
    expect(ledger.snapshotDailyBrainPitcherKPicks).not.toHaveBeenCalled();
    expect(ledger.getBrainMlbPicksForDate).toHaveBeenCalledWith("2026-07-12", 20);
    const body = await response.json();
    expect(body.aiReviews).toMatchObject({ home_run: { status: "live" } });
    expect(body.provenance).toMatchObject({ home_run: "live_selection" });
    expect(body.engineVersions).toMatchObject({ home_run: "brain-hr-selection@2" });
    expect(body.doors.schedule.source).toContain("MLB Stats API");
    expect(body.picks).toMatchObject([{ playerName: "Slugger" }]);
    expect(body.pitcherStrikeouts.picks).toMatchObject([{ playerName: "Starter", result: "pending" }]);
  });

  it("returns sourced MLB scan coverage", async () => {
    const response = await fetch(`${baseUrl}/api/intelligence/brain/mlb/scan?date=2026-07-12`);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.scan).toMatchObject({ sport: "mlb", coverage: { games: 15, playersScanned: 180 } });
  });

  it("runs bounded Brain operations through the cron-only endpoint", async () => {
    const response = await fetch(`${baseUrl}/api/cron/intelligence/brain/mlb?date=2026-07-12`);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({ date: "2026-07-12", upcomingGames: 2, snapshotAttempted: true, settled: 3 });
  });
});
