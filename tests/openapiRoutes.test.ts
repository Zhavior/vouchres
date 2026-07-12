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
    expect(body.paths["/api/mlb/hr-feed/today"]).toBeTruthy();
    expect(body.paths["/api/mlb/live-at-bat/{gamePk}"]).toBeTruthy();
    expect(body.paths["/api/mlb/hr-board/player/{playerId}"]).toBeTruthy();
    expect(body.paths["/api/mlb/hr-board/today/pool"]).toBeTruthy();
    expect(body.paths["/api/mlb/hr-board/today/debug"]).toBeTruthy();
    expect(body.paths["/api/notifications/unread-count"]).toBeTruthy();
    expect(body.paths["/api/cron/parlays/integrity"]).toBeTruthy();
    expect(body.paths["/api/billing/status"]).toBeTruthy();
    expect(body.paths["/api/parlays/grade-due"]).toBeTruthy();
    expect(Object.keys(body.paths).length).toBeGreaterThanOrEqual(29);
  });

  it("documents the canonical stateless parlay grading contract", async () => {
    const response = await fetch(`${baseUrl}/api/openapi.json`);
    const body = await response.json();
    const operation = body.paths["/api/parlays/grade"].post;
    const requestSchema = operation.requestBody.content["application/json"].schema;
    const request = requestSchema.$ref
      ? body.components.schemas[requestSchema.$ref.split("/").at(-1)]
      : requestSchema;
    const legSchema = request.properties.legs.items;
    const gradeResponse = operation.responses["200"].content["application/json"].schema;
    const success = gradeResponse.$ref
      ? body.components.schemas[gradeResponse.$ref.split("/").at(-1)]
      : gradeResponse;

    expect(request.properties.legs.maxItems).toBe(12);
    expect(legSchema.properties).toHaveProperty("threshold");
    expect(legSchema.properties).toHaveProperty("oddsDecimal");
    expect(request.properties.stakeUnits.maximum).toBe(100000);
    expect(success.properties).toHaveProperty("gradedAt");
    expect(success.properties).toHaveProperty("meta");
    expect(operation.responses).toHaveProperty("400");
    expect(operation.responses).toHaveProperty("429");
  });
});
