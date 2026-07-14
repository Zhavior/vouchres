import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { apiErrorHandler } from "../server/middleware/errorHandler";
import { requestContext } from "../server/middleware/requestContext";
import { getBackendHealthReport } from "../server/services/health/backendHealthService";
import { getRouteMetricsSnapshot } from "../server/lib/observability/routeMetrics";
import { getParlayGradeMetricsSnapshot } from "../server/lib/observability/parlayGradeMetrics";
import { apiOkFlat } from "../server/lib/apiResponse";
import type { RequestWithContext } from "../server/middleware/requestContext";
import type { Response } from "express";

vi.mock("../server/middleware/auth", () => ({
  requireAuth: (req: any, _res: unknown, next: () => void) => {
    req.user = { id: "staff_1", profile: { is_staff: true } };
    next();
  },
  requireStaff: (_req: unknown, _res: unknown, next: () => void) => next(),
  getSupabaseAdmin: async () => ({ from: () => ({ select: () => ({ limit: () => ({}) }) }) }),
}));

import { requireAuth, requireStaff } from "../server/middleware/auth";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(requestContext);
  app.use(express.json());

  app.get("/api/health/backend", requireAuth, requireStaff, (req: RequestWithContext, res: Response) => {
    const report = getBackendHealthReport();
    res.json(apiOkFlat(req, report as unknown as Record<string, unknown>));
  });

  app.get("/api/health/metrics", requireAuth, requireStaff, (req: RequestWithContext, res: Response) => {
    res.json(apiOkFlat(req, {
      service: "vouchedge-backend",
      schema: "route_metrics_v2",
      metrics: getRouteMetricsSnapshot(),
      parlayGrade: getParlayGradeMetricsSnapshot(),
    }));
  });

  app.use("/api", apiErrorHandler);

  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("bind failed");
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

describe("staff-gated health telemetry", () => {
  it("returns backend health for staff", async () => {
    const response = await fetch(`${baseUrl}/api/health/backend`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.service).toBe("vouchedge-backend");
    expect(body.productionProof).toBeTruthy();
  });

  it("returns metrics for staff", async () => {
    const response = await fetch(`${baseUrl}/api/health/metrics`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.schema).toBe("route_metrics_v2");
  });
});
