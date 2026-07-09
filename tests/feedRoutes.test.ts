import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { feedRoutes } from "../server/routes/feedRoutes";

vi.mock("../server/services/feed/composerOptionsService", () => ({
  getFeedComposerOptions: vi.fn(),
}));

import { getFeedComposerOptions } from "../server/services/feed/composerOptionsService";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use("/api", feedRoutes);
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

describe("feed routes", () => {
  it("returns ok envelope for composer options", async () => {
    vi.mocked(getFeedComposerOptions).mockResolvedValueOnce({
      sport: "MLB",
      date: "2026-07-08",
      games: [],
      markets: [{ id: "HR", label: "Home Run" }],
      warnings: [],
    });

    const response = await fetch(`${baseUrl}/api/feed/composer-options?date=2026-07-08`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      sport: "MLB",
      date: "2026-07-08",
      games: [],
    });
  });

  it("normalizes upstream failures to upstream_unavailable", async () => {
    vi.mocked(getFeedComposerOptions).mockRejectedValueOnce(new Error("mlb down"));

    const response = await fetch(`${baseUrl}/api/feed/composer-options`);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "upstream_unavailable",
        message: "Composer options unavailable.",
      },
    });
  });
});
