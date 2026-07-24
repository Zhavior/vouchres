import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { requestContext } from "../server/middleware/requestContext";
import { registerResultRoutes } from "../server/routes/resultRoutes";

vi.mock("../server/middleware/auth", () => ({
  requireAuth: (req: any, _res: unknown, next: () => void) => {
    req.user = { id: "user-1", profile: { is_staff: false } };
    next();
  },
  requireStaff: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock("../server/middleware/rateLimit", () => ({
  gradingLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const gradePick = vi.fn(async () => true);

vi.mock("../server/services/persistence/pickService", () => ({
  getLedger: vi.fn(async () => ({
    picks: [{ id: "pick-1", status: "pending" }],
    total: 1,
  })),
  gradePick: (...args: unknown[]) => gradePick(...args),
}));

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(requestContext);
  app.use(express.json());
  registerResultRoutes(app);
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

describe("result routes", () => {
  it("returns ok envelope for current-user ledger", async () => {
    const response = await fetch(`${baseUrl}/api/results/ledger`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      scope: "current_user",
      total: 1,
      meta: {
        requestId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
    expect(response.headers.get("x-request-id")).toBe(body.meta.requestId);
    expect(body.picks).toHaveLength(1);
  });

  it("grades via Postgres persistence (not in-memory seed ledger)", async () => {
    gradePick.mockResolvedValueOnce(true);
    const response = await fetch(`${baseUrl}/api/results/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pickId: "pick-1",
        result: "win",
        whatActuallyHappened: "home run",
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(gradePick).toHaveBeenCalledWith(
      expect.objectContaining({
        pickId: "pick-1",
        status: "won",
        learningNote: "home run",
      }),
    );
    expect(body).toMatchObject({
      ok: true,
      pickId: "pick-1",
      status: "won",
      source: "postgres",
      meta: {
        requestId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
  });

  it("rejects grade without pickId using unified envelope", async () => {
    const response = await fetch(`${baseUrl}/api/results/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result: "win" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "validation_error",
      },
    });
  });
});
