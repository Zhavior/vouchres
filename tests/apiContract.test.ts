import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES, isApiErrorCode } from "../server/lib/errorCodes";
import { buildApiMeta } from "../server/lib/apiResponseMeta";
import { apiOk, apiOkFlat, buildApiErrorResponse as buildError } from "../server/lib/apiResponse";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { apiNotFoundHandler } from "../server/middleware/apiNotFound";
import { requestContext } from "../server/middleware/requestContext";
import { routeTiming } from "../server/middleware/routeTiming";
import { registerApiRoutes } from "../server/routes";
import { buildOpenApiDocument } from "../server/openapi/openapiRegistry";

/** Top frontend-called API paths — must stay registered in OpenAPI. */
const TOP_FE_API_PATHS = [
  "/api/mlb/hr-board/today",
  "/api/mlb/lineup/today",
  "/api/auth/me",
  "/api/me/parlays",
  "/api/feed",
  "/api/ai/parlay-edge",
  "/api/billing/status",
  "/api/notifications",
  "/api/mlb/reports/daily",
  "/api/parlays/grade",
  "/api/users/handle/{handle}",
  "/api/auth/handle-check",
  "/api/auth/username-check",
  "/api/mlb/live",
  "/api/health/backend",
] as const;

const MIN_OPENAPI_PATHS = 20;

let contractServer: Server;
let contractBaseUrl: string;

async function requestJson(
  path: string,
  init?: RequestInit,
): Promise<{ status: number; headers: Headers; body: any }> {
  const response = await fetch(`${contractBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  return {
    status: response.status,
    headers: response.headers,
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
    contractServer = app.listen(0, "127.0.0.1", () => {
      const address = contractServer.address();
      if (!address || typeof address === "string") throw new Error("Contract test server did not bind.");
      contractBaseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  vi.unstubAllEnvs();
  if (contractServer) {
    await new Promise<void>((resolve, reject) => {
      contractServer.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

describe("API contract helpers", () => {
  it("exposes shared error codes with stable HTTP status mappings", () => {
    expect(isApiErrorCode("not_found")).toBe(true);
    expect(isApiErrorCode("upstream_unavailable")).toBe(true);
    expect(isApiErrorCode("parlay_post_locked")).toBe(true);
    expect(isApiErrorCode("made_up_code")).toBe(false);
    expect(API_ERROR_CODES.not_found).toBe(404);
    expect(API_ERROR_CODES.upstream_unavailable).toBe(503);
    expect(API_ERROR_CODES.parlay_post_locked).toBe(403);
  });

  it("builds success and error envelopes with request metadata", () => {
    const req = { requestId: "req_contract_1" } as any;
    const success = apiOk(req, { value: 1 }, buildApiMeta({
      source: "test",
      dataQuality: "limited",
      warnings: [],
    }));

    expect(success).toMatchObject({
      ok: true,
      data: { value: 1 },
      meta: {
        source: "test",
        dataQuality: "limited",
        requestId: "req_contract_1",
        timestamp: expect.any(String),
      },
    });

    const failure = buildError({
      code: "validation_error",
      message: "Invalid input.",
      requestId: "req_contract_2",
      details: [{ path: "date", message: "Expected YYYY-MM-DD." }],
    });

    expect(failure).toEqual({
      ok: false,
      error: {
        code: "validation_error",
        message: "Invalid input.",
        requestId: "req_contract_2",
        details: [{ path: "date", message: "Expected YYYY-MM-DD." }],
      },
      meta: {
        requestId: "req_contract_2",
        timestamp: expect.any(String),
      },
    });
  });

  it("merges request metadata into flat success payloads", () => {
    const payload = apiOkFlat(
      { requestId: "req_flat_1" } as any,
      {
        date: "2026-07-09",
        rows: [],
        meta: buildApiMeta({
          source: "validated_hr_board_pipeline",
          dataQuality: "validated_hr_board",
          warnings: [],
        }),
      },
    );

    expect(payload.ok).toBe(true);
    expect(payload.date).toBe("2026-07-09");
    expect(payload.meta).toMatchObject({
      source: "validated_hr_board_pipeline",
      dataQuality: "validated_hr_board",
      requestId: "req_flat_1",
      timestamp: expect.any(String),
    });
  });
});

describe("API contract over HTTP", () => {
  it("propagates inbound x-request-id through headers and error envelopes", async () => {
    const response = await requestJson("/api/does-not-exist", {
      headers: { "x-request-id": "req_inbound_42" },
    });

    expect(response.status).toBe(404);
    expect(response.headers.get("x-request-id")).toBe("req_inbound_42");
    expect(response.body).toMatchObject({
      ok: false,
      error: {
        code: "not_found",
        requestId: "req_inbound_42",
      },
      meta: {
        requestId: "req_inbound_42",
        timestamp: expect.any(String),
      },
    });
  });

  it("generates request IDs when inbound header is missing", async () => {
    const response = await requestJson("/api/does-not-exist");

    expect(response.status).toBe(404);
    expect(typeof response.headers.get("x-request-id")).toBe("string");
    expect(response.headers.get("x-request-id")).toBe(response.body.error.requestId);
    expect(response.body.meta.requestId).toBe(response.body.error.requestId);
  });

  it("returns HR board validation errors with shared validation_error code", async () => {
    const response = await requestJson("/api/mlb/hr-board/date/bad-date");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("validation_error");
    expect(response.body.error.details).toEqual([
      { path: "date", message: "Expected YYYY-MM-DD." },
    ]);
  });

  it("registers top frontend API paths in OpenAPI", () => {
    const doc = buildOpenApiDocument();
    const registered = Object.keys(doc.paths ?? {});

    expect(registered.length).toBeGreaterThanOrEqual(MIN_OPENAPI_PATHS);

    for (const path of TOP_FE_API_PATHS) {
      expect(registered, `missing OpenAPI path ${path}`).toContain(path);
    }
  });

  it("returns request meta on public MLB health endpoints", async () => {
    const response = await requestJson("/api/health/backend");

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(typeof response.headers.get("x-request-id")).toBe("string");
  });
});
