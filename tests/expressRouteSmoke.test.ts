import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { apiNotFoundHandler } from "../server/middleware/apiNotFound";
import { requestContext } from "../server/middleware/requestContext";
import { routeTiming } from "../server/middleware/routeTiming";
import { registerApiRoutes } from "../server/routes";

let server: Server;
let baseUrl: string;

async function requestJson(path: string, init?: RequestInit): Promise<{ status: number; body: any }> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  return {
    status: response.status,
    body: await response.json(),
  };
}

beforeAll(async () => {
  vi.stubEnv("CRON_SECRET", "");

  const app = express();
  app.use(requestContext);
  app.use(routeTiming);
  app.use(express.json());
  registerApiRoutes(app);
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

afterAll(async () => {
  vi.unstubAllEnvs();
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

describe("API route smoke envelopes", () => {
  it("returns JSON 404s for unknown API routes", async () => {
    const response = await requestJson("/api/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      ok: false,
      error: {
        code: "not_found",
        message: "API route not found: GET /api/does-not-exist",
      },
    });
    expect(response.body.error.requestId).toEqual(expect.any(String));
  });

  it("exposes scrape-friendly route metrics snapshot", async () => {
    await requestJson("/api/health");
    const response = await requestJson("/api/health/metrics");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      ok: false,
      error: {
        code: expect.stringMatching(/missing_token|unauthorized|invalid_token/),
        requestId: expect.any(String),
      },
    });
  });

  it("keeps public liveness open while staff-gating backend health", async () => {
    const coreHealth = await requestJson("/api/system/core-health");
    expect(coreHealth.status).toBe(200);
    expect(coreHealth.body).toMatchObject({
      ok: true,
      status: "ok",
      service: "vouchedge-core",
    });

    const liveness = await requestJson("/api/health");
    expect(liveness.status).toBe(200);
    expect(liveness.body).toMatchObject({
      ok: true,
      status: "ok",
      service: "vouchedge-backend",
    });

    const response = await requestJson("/api/health/backend");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      ok: false,
      error: {
        code: expect.stringMatching(/missing_token|unauthorized|invalid_token/),
        requestId: expect.any(String),
      },
    });
  });

  it("normalizes public MLB validation errors", async () => {
    const badDate = await requestJson("/api/mlb/live?date=bad-date");
    expect(badDate.status).toBe(400);
    expect(badDate.body).toMatchObject({
      ok: false,
      error: {
        code: "validation_error",
        message: "date must use YYYY-MM-DD format.",
      },
    });
    expect(badDate.body.error.requestId).toEqual(expect.any(String));

    const badGamePk = await requestJson("/api/mlb/matchup/not-a-number");
    expect(badGamePk.status).toBe(400);
    expect(badGamePk.body.error).toMatchObject({
      code: "validation_error",
      message: "gamePk must be a positive integer.",
    });

    const badLiveAtBatGamePk = await requestJson("/api/mlb/live-at-bat/not-a-number");
    expect(badLiveAtBatGamePk.status).toBe(400);
    expect(badLiveAtBatGamePk.body.error).toMatchObject({
      code: "validation_error",
      message: "gamePk must be a positive integer.",
      details: [{ path: "gamePk", message: "Expected positive integer." }],
    });

    const badReportDate = await requestJson("/api/mlb/reports/hr-targets?date=bad-date");
    expect(badReportDate.status).toBe(400);
    expect(badReportDate.body.error).toMatchObject({
      code: "validation_error",
      message: "date must use YYYY-MM-DD format.",
      details: [{ path: "date", message: "Expected YYYY-MM-DD." }],
    });
  });

  it("normalizes parlay grade validation errors", async () => {
    const response = await requestJson("/api/parlays/grade", {
      method: "POST",
      body: JSON.stringify({ legs: [] }),
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      ok: false,
      error: {
        code: "validation_error",
        message: "Request validation failed.",
        details: [{ path: "legs", message: "legs must include at least 1 item." }],
      },
    });
  });

  it("normalizes HR board validation errors before upstream work", async () => {
    const badDate = await requestJson("/api/mlb/hr-board/date/bad-date");
    expect(badDate.status).toBe(400);
    expect(badDate.body.error).toMatchObject({
      code: "validation_error",
      message: "date must use YYYY-MM-DD format.",
      details: [{ path: "date", message: "Expected YYYY-MM-DD." }],
    });

    const badPreviewLimit = await requestJson("/api/mlb/hr-board/today?previewLimit=500");
    expect(badPreviewLimit.status).toBe(400);
    expect(badPreviewLimit.body.error).toMatchObject({
      code: "validation_error",
      message: "previewLimit must be an integer between 10 and 350.",
      details: [{ path: "previewLimit", message: "Expected integer 10-350." }],
    });

    const badPlayerId = await requestJson("/api/mlb/hr-board/player/not-a-player");
    expect(badPlayerId.status).toBe(400);
    expect(badPlayerId.body.error).toMatchObject({
      code: "validation_error",
      message: "playerId must be a positive integer.",
      details: [{ path: "playerId", message: "Expected positive integer." }],
    });

    const badEdgeResearchPitcher = await requestJson("/api/mlb/players/592450/edge-research?pitcherId=bad");
    expect(badEdgeResearchPitcher.status).toBe(400);
    expect(badEdgeResearchPitcher.body.error).toMatchObject({
      code: "validation_error",
      message: "pitcherId must be a positive integer.",
    });
  });

  it("normalizes MLB player registry validation errors before upstream work", async () => {
    const response = await requestJson("/api/mlb/players/not-a-player");

    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({
      code: "validation_error",
      message: "playerId must be a positive integer.",
      details: [{ path: "playerId", message: "Expected positive integer." }],
    });
  });

  it("keeps unsupported feed composer sports as safe warnings", async () => {
    const response = await requestJson("/api/feed/composer-options?sport=NFL&date=2026-07-07");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      ok: true,
      sport: "MLB",
      date: "2026-07-07",
      games: [],
    });
    expect(response.body.warnings?.[0]).toContain('Unsupported sport "NFL"');
  });

  it("normalizes cron query validation errors before side effects", async () => {
    const badDays = await requestJson("/api/cron/parlays/grade-due?days=bad");
    expect(badDays.status).toBe(400);
    expect(badDays.body.error).toMatchObject({
      code: "validation_error",
      message: "days must be an integer between 1 and 7.",
    });

    const badDryRun = await requestJson("/api/cron/parlays/repair-identity?dryRun=maybe", { method: "POST" });
    expect(badDryRun.status).toBe(400);
    expect(badDryRun.body.error).toMatchObject({
      code: "validation_error",
      message: "dryRun must be true or false.",
    });

    const badLimit = await requestJson("/api/cron/parlays/quarantine-legacy?limit=500", { method: "POST" });
    expect(badLimit.status).toBe(400);
    expect(badLimit.body.error).toMatchObject({
      code: "validation_error",
      message: "limit must be an integer between 1 and 100.",
    });
  });

  it("denies cron routes in production when CRON_SECRET is unset", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CRON_SECRET", "");

    const response = await requestJson("/api/cron/parlays/grade-due");
    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      ok: false,
      error: {
        code: "internal_server_error",
        message: "Internal server error.",
      },
    });

    vi.unstubAllEnvs();
  });

  it("normalizes missing auth on canonical parlay save", async () => {
    const response = await requestJson("/api/parlays/save", {
      method: "POST",
      body: JSON.stringify({ legs: [] }),
    });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      ok: false,
      error: {
        code: "missing_token",
        message: "Authentication token is required.",
      },
    });
  });
});
