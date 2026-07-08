import { afterEach, describe, expect, it, vi } from "vitest";
import { getSportsHttpStats, sportsFetchJson } from "../server/lib/sports/sportsHttpClient";
import { getMlbStatsCircuitBreaker, resetMlbStatsCircuitBreakerForTests } from "../server/lib/sports/circuitBreaker";

describe("sports HTTP client", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    resetMlbStatsCircuitBreakerForTests();
  });

  it("can serve a bounded stale cache value when an upstream refresh fails", async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, version: 1 }), { status: 200 }))
      .mockResolvedValueOnce(new Response("bad gateway", { status: 502 }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(sportsFetchJson<{ version: number }>("https://example.test/data", {
      cacheKey: "sports-http-stale-test",
      ttlMs: 1_000,
      staleIfErrorMs: 5_000,
      retries: 0,
    })).resolves.toEqual({ ok: true, version: 1 });

    vi.setSystemTime(Date.now() + 1_500);

    await expect(sportsFetchJson<{ version: number }>("https://example.test/data", {
      cacheKey: "sports-http-stale-test",
      ttlMs: 1_000,
      staleIfErrorMs: 5_000,
      retries: 0,
    })).resolves.toEqual({ ok: true, version: 1 });
  });

  it("does not serve stale cache values past the explicit stale window", async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, version: 1 }), { status: 200 }))
      .mockResolvedValueOnce(new Response("bad gateway", { status: 502 }));

    vi.stubGlobal("fetch", fetchMock);

    await sportsFetchJson("https://example.test/expired", {
      cacheKey: "sports-http-expired-stale-test",
      ttlMs: 1_000,
      staleIfErrorMs: 5_000,
      retries: 0,
    });

    vi.setSystemTime(Date.now() + 7_000);

    await expect(sportsFetchJson("https://example.test/expired", {
      cacheKey: "sports-http-expired-stale-test",
      ttlMs: 1_000,
      staleIfErrorMs: 5_000,
      retries: 0,
    })).rejects.toThrow("HTTP 502");
  });

  it("reports bounded cache capacity for production visibility", () => {
    expect(getSportsHttpStats().maxCacheEntries).toBeGreaterThan(0);
    expect(getSportsHttpStats().cacheSize).toBeLessThanOrEqual(getSportsHttpStats().maxCacheEntries);
  });

  it("serves last-good cache when MLB circuit is open", async () => {
    vi.useFakeTimers();
    resetMlbStatsCircuitBreakerForTests();

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, version: 1 }), { status: 200 }))
      .mockResolvedValue(new Response("service unavailable", { status: 503 }));

    vi.stubGlobal("fetch", fetchMock);

    const url = "https://statsapi.mlb.com/api/v1/schedule?sportId=1";

    await sportsFetchJson<{ version: number }>(url, {
      cacheKey: "sports-http-circuit-test",
      ttlMs: 1_000,
      retries: 0,
    });

    vi.setSystemTime(Date.now() + 1_500);

    const breaker = getMlbStatsCircuitBreaker();
    for (let i = 0; i < 5; i += 1) {
      breaker.recordFailure();
    }
    expect(breaker.getState()).toBe("open");

    await expect(sportsFetchJson<{ version: number }>(url, {
      cacheKey: "sports-http-circuit-test",
      ttlMs: 1_000,
      retries: 0,
    })).resolves.toEqual({ ok: true, version: 1 });
  });
});
