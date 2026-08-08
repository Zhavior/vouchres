/**
 * /api/health/ready is exempt from every rate limiter (PROBE_PATHS in
 * server/middleware/rateLimit.ts) so a limiter blip can't get the instance
 * evicted from the load balancer. That exemption made it the cheapest amplifier
 * in the API: each unauthenticated GET ran a Supabase query AND an Upstash PING
 * with no ceiling at all.
 *
 * The probe verdict is now memoized for a few seconds and single-flighted, so
 * these tests count real upstream calls rather than inspecting source text.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let dbProbes = 0;
let redisPings = 0;
let dbError: { message: string } | null = null;

vi.mock("../server/middleware/auth", () => ({
  getSupabaseAdmin: async () => ({
    from: () => ({
      select: () => ({
        limit: async () => {
          dbProbes += 1;
          return { error: dbError };
        },
      }),
    }),
  }),
}));

vi.mock("../server/lib/upstashRedis", () => ({
  isUpstashEnabled: () => true,
  redisPing: async () => {
    redisPings += 1;
    return true;
  },
}));

describe("readiness probe does not amplify unauthenticated traffic", () => {
  beforeEach(async () => {
    dbProbes = 0;
    redisPings = 0;
    dbError = null;
    const { resetReadinessCacheForTests } = await import("../server/lib/readinessProbe");
    resetReadinessCacheForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("serves a burst of sequential probes from one upstream round-trip", async () => {
    const { getReadiness } = await import("../server/lib/readinessProbe");

    for (let i = 0; i < 50; i += 1) {
      const result = await getReadiness();
      expect(result.ready).toBe(true);
    }

    // The bug: 50 requests meant 50 DB queries and 50 PINGs.
    expect(dbProbes).toBe(1);
    expect(redisPings).toBe(1);
  });

  it("collapses a concurrent burst into a single in-flight probe", async () => {
    const { getReadiness } = await import("../server/lib/readinessProbe");

    const results = await Promise.all(Array.from({ length: 25 }, () => getReadiness()));

    expect(results.every((r) => r.ready)).toBe(true);
    expect(dbProbes).toBe(1);
    expect(redisPings).toBe(1);
  });

  it("marks cached answers so the response can advertise staleness", async () => {
    const { getReadiness } = await import("../server/lib/readinessProbe");

    expect((await getReadiness()).fresh).toBe(true);
    expect((await getReadiness()).fresh).toBe(false);
  });

  it("re-probes once the short TTL expires", async () => {
    const { getReadiness } = await import("../server/lib/readinessProbe");

    await getReadiness();
    expect(dbProbes).toBe(1);

    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 6_000);
    await getReadiness();
    vi.useRealTimers();

    expect(dbProbes).toBe(2);
  });

  it("still reports not-ready when the database is unreachable", async () => {
    const { getReadiness, resetReadinessCacheForTests } = await import(
      "../server/lib/readinessProbe"
    );

    dbError = { message: "connection refused" };
    resetReadinessCacheForTests();

    const result = await getReadiness();
    expect(result.ready).toBe(false);
    expect(result.checks.database.ok).toBe(false);
  });

  it("stays ready when only Redis is down", async () => {
    const { getReadiness } = await import("../server/lib/readinessProbe");

    const result = await getReadiness();
    expect(result.ready).toBe(true);
    expect(result.checks.redis.ok).toBe(true);
  });
});
