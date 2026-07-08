import { afterEach, describe, expect, it, vi } from "vitest";
import { sportsFetchJson } from "../server/lib/sports/sportsHttpClient";

describe("sports HTTP client", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
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
});
