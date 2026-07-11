import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { registerNflRoutes } from "../server/routes/nflRoutes";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  registerNflRoutes(app);
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

describe("NFL routes stub", () => {
  it("returns honest not-ready for lineup endpoint", async () => {
    const response = await fetch(`${baseUrl}/api/nfl/lineup/today`);
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.warnings?.[0]).toMatch(/not live yet/i);
  });
});
