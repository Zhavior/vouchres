import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { requestContext } from "../server/middleware/requestContext";
import { parlayLiveRoutes } from "../server/routes/parlay/parlayLiveRoutes";

vi.mock("../server/services/parlays/parlayLiveProgressRouter", () => ({
  fetchParlayLiveProgressBySport: vi.fn(async () => []),
}));

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(requestContext);
  app.use(express.json());
  app.use("/api", parlayLiveRoutes);
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

describe("parlay live progress auth gate", () => {
  it("returns 401 for unauthenticated live progress", async () => {
    const response = await fetch(`${baseUrl}/api/parlays/live-progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        legs: [{ gamePk: "777001", playerId: "592450", sport: "mlb" }],
      }),
    });

    expect(response.status).toBe(401);
  });
});
