import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { openapiRoutes } from "../server/routes/openapiRoutes";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use("/api", openapiRoutes);

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

describe("openapi routes", () => {
  it("serves OpenAPI 3 document at /api/openapi.json", async () => {
    const response = await fetch(`${baseUrl}/api/openapi.json`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.openapi).toMatch(/^3\./);
    expect(body.info.title).toBe("VouchEdge API");
    expect(body.paths["/api/health/backend"]).toBeTruthy();
    expect(body.paths["/api/mlb/live"]).toBeTruthy();
    expect(body.paths["/api/mlb/hr-board/today"]).toBeTruthy();
    expect(body.paths["/api/parlays/save"]).toBeTruthy();
    expect(body.paths["/api/cron/parlays/grade-due"]).toBeTruthy();
    expect(body.paths["/api/notifications"]).toBeTruthy();
    expect(body.paths["/api/mlb/matchups/today"]).toBeTruthy();
    expect(body.paths["/api/mlb/reports/daily"]).toBeTruthy();
    expect(body.paths["/api/auth/signout"]).toBeTruthy();
  });
});
