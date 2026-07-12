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
});
