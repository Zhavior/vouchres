import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
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

vi.mock("../server/services/persistence/pickService", () => ({
  getLedger: vi.fn(async () => ({
    picks: [{ id: "pick-1", status: "pending" }],
    total: 1,
  })),
}));

vi.mock("../server/services/results/learningNoteService", () => ({
  gradeAndLearn: vi.fn(async () => ({
    pick: { id: "pick-1", status: "win" },
    learningNote: "note",
  })),
}));

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
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
    });
    expect(body.picks).toHaveLength(1);
  });

  it("returns ok envelope for staff grading", async () => {
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
    expect(body).toMatchObject({
      ok: true,
      pick: { id: "pick-1", status: "win" },
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
