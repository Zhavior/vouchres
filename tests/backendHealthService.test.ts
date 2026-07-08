import { afterEach, describe, expect, it, vi } from "vitest";
import { getBackendHealthReport } from "../server/services/health/backendHealthService";
import { resetRouteMetricsForTests, recordRouteMetric } from "../server/lib/observability/routeMetrics";

describe("backend health report", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    resetRouteMetricsForTests();
  });

  it("reports uptime, API metrics, cache stats, and dependency mode", () => {
    vi.stubEnv("NODE_ENV", "development");
    resetRouteMetricsForTests();
    recordRouteMetric({
      method: "GET",
      route: "/api/test",
      status: 200,
      durationMs: 42,
      requestId: "req_test",
    });

    const report = getBackendHealthReport(new Date("2026-07-08T22:00:00.000Z"));

    expect(report).toMatchObject({
      ok: true,
      status: "ok",
      service: "vouchedge-backend",
      environment: "development",
      dependencies: {
        redis: {
          enabled: false,
          mode: "memory_fallback",
        },
      },
      api: {
        totals: {
          requests: 1,
          errors: 0,
          slowRequests: 0,
        },
        statusClasses: {
          "2xx": 1,
          "3xx": 0,
          "4xx": 0,
          "5xx": 0,
        },
      },
      updatedAt: "2026-07-08T22:00:00.000Z",
      warnings: [],
    });
    expect(report.memory.rssMb).toEqual(expect.any(Number));
    expect(report.cache.mlbSchedule).toEqual(expect.objectContaining({ size: expect.any(Number) }));
    expect(report.dependencies.sportsHttp).toEqual(expect.objectContaining({ requests: expect.any(Number) }));
  });

  it("degrades only production health when required production config is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("CRON_SECRET", "");

    const report = getBackendHealthReport(new Date("2026-07-08T22:00:00.000Z"));

    expect(report.status).toBe("degraded");
    expect(report.warnings.join(" ")).toContain("Missing required production config");
    expect(report.warnings.join(" ")).toContain("CRON_SECRET");
  });
});
