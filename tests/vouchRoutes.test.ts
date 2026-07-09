import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { requestContext } from "../server/middleware/requestContext";
import { vouchRoutes } from "../server/routes/vouchRoutes";

vi.mock("../server/middleware/auth", () => ({
  optionalAuth: (req: any, _res: unknown, next: () => void) => {
    req.user = undefined;
    next();
  },
  requireAuth: (req: any, _res: unknown, next: () => void) => {
    req.user = { id: "user_test" };
    next();
  },
}));

vi.mock("../server/services/persistence/vouchService", () => ({
  listVouchesForUser: vi.fn(),
  createVouch: vi.fn(),
  hideVouch: vi.fn(),
}));

vi.mock("../server/middleware/ownership", () => ({
  assertUserOwnsResource: vi.fn(async () => ({ ok: true })),
}));

import { createVouch, hideVouch, listVouchesForUser } from "../server/services/persistence/vouchService";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(requestContext);
  app.use(express.json());
  app.use("/api", vouchRoutes);
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

describe("vouch routes", () => {
  it("returns empty vouch list for unauthenticated users", async () => {
    const response = await fetch(`${baseUrl}/api/vouches`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      vouches: [],
      meta: {
        requestId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
  });

  it("returns unified not_found envelope when hide misses", async () => {
    vi.mocked(hideVouch).mockResolvedValueOnce(false);

    const response = await fetch(`${baseUrl}/api/vouches/missing`, { method: "DELETE" });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "not_found",
        message: "Vouch not found.",
      },
    });
  });

  it("creates vouches with ok envelope while preserving id", async () => {
    vi.mocked(createVouch).mockResolvedValueOnce({
      id: "vouch_1",
      market: "HR",
      game_name: "NYY @ BOS",
    } as any);

    const response = await fetch(`${baseUrl}/api/vouches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vouch_source: "board",
        market: "HR",
        game_name: "NYY @ BOS",
        odds: "+240",
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      ok: true,
      id: "vouch_1",
      market: "HR",
      meta: {
        requestId: expect.any(String),
        timestamp: expect.any(String),
      },
    });
    expect(listVouchesForUser).not.toHaveBeenCalled();
  });
});
