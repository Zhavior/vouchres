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
        sentry: {
          enabled: false,
          configured: false,
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
    expect(report.cache.hrValidatedBoard).toEqual(expect.objectContaining({ size: expect.any(Number) }));
    expect(report.dependencies.sportsHttp).toEqual(expect.objectContaining({ requests: expect.any(Number) }));
  });

  it("degrades only production health when required production config is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("CRON_SECRET", "");
    vi.stubEnv("SENTRY_DSN", "https://example.ingest.sentry.io/1");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");

    const report = getBackendHealthReport(new Date("2026-07-08T22:00:00.000Z"));

    expect(report.status).toBe("degraded");
    expect(report.warnings.join(" ")).toContain("Missing required production config");
    expect(report.warnings.join(" ")).toContain("CRON_SECRET");
  });

  it("warns in production when Sentry and Redis are missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role");
    vi.stubEnv("CRON_SECRET", "cron-secret");
    vi.stubEnv("SENTRY_DSN", "");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const report = getBackendHealthReport(new Date("2026-07-08T22:00:00.000Z"));

    expect(report.status).toBe("degraded");
    expect(report.warnings.join(" ")).toContain("SENTRY_DSN");
    expect(report.warnings.join(" ")).toContain("Upstash Redis");
  });

  it("requires Stripe webhook secret in production when Stripe secret is configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role");
    vi.stubEnv("CRON_SECRET", "cron-secret");
    vi.stubEnv("SENTRY_DSN", "https://example.ingest.sentry.io/1");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");

    const report = getBackendHealthReport(new Date("2026-07-08T22:00:00.000Z"));

    expect(report.status).toBe("degraded");
    expect(report.warnings.join(" ")).toContain("STRIPE_WEBHOOK_SECRET");
  });

  it("exposes productionProof checklist with envReady and soakPending", () => {
    vi.stubEnv("NODE_ENV", "development");

    const report = getBackendHealthReport(new Date("2026-07-08T22:00:00.000Z"));

    expect(report.productionProof).toEqual(
      expect.objectContaining({
        envReady: expect.any(Boolean),
        soakPending: expect.arrayContaining([
          expect.objectContaining({ id: "db_grading_soak", ready: true }),
          expect.objectContaining({ id: "multi_instance_soak", ready: true }),
          expect.objectContaining({ id: "upstream_fallback_coverage", ready: true }),
        ]),
        items: expect.any(Array),
      }),
    );
    expect(report.productionProof.items.length).toBeGreaterThanOrEqual(6);
    expect(report.config.every((check) => typeof check.requiredForProductionProof === "boolean")).toBe(true);

    const fallback = report.productionProof.soakPending.find((item) => item.id === "upstream_fallback_coverage");
    expect(fallback?.detail).toContain("Redis L2");
    expect(fallback?.detail).toMatch(/HR board hub|HR feed|daily report|live at-bat|lineup board/);
  });

  it("marks productionProof.envReady when all proof env vars are present", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role");
    vi.stubEnv("CRON_SECRET", "cron-secret");
    vi.stubEnv("SENTRY_DSN", "https://example.ingest.sentry.io/1");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");

    const report = getBackendHealthReport(new Date("2026-07-08T22:00:00.000Z"));

    expect(report.productionProof.envReady).toBe(true);
    expect(report.productionProof.items.find((item) => item.id === "cron_secret")?.ready).toBe(true);
    expect(report.productionProof.items.find((item) => item.id === "sentry_dsn")?.ready).toBe(true);
    expect(report.productionProof.items.find((item) => item.id === "upstash_redis")?.ready).toBe(true);
    expect(report.productionProof.soakPending.every((item) => item.ready === true)).toBe(true);
    expect(report.warnings.join(" ")).not.toContain("Production proof env incomplete");
  });
});
