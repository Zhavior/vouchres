import { afterEach, describe, expect, it, vi } from "vitest";
import { HybridTTLCache } from "../server/lib/hybridTTLCache";
import { isUpstashEnabled, redisGetJson, redisSetJson } from "../server/lib/upstashRedis";

vi.mock("../server/lib/upstashRedis", () => ({
  isUpstashEnabled: vi.fn(() => false),
  redisGetJson: vi.fn(),
  redisSetJson: vi.fn(),
}));

describe("HybridTTLCache", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.mocked(isUpstashEnabled).mockReturnValue(false);
  });

  it("uses memory cache when Redis is disabled", async () => {
    const cache = new HybridTTLCache<string>(60_000, "test:hybrid", "test:redis");
    const producer = vi.fn(async () => "value");

    const first = await cache.getOrSet("board:2026-07-08", producer);
    const second = await cache.getOrSet("board:2026-07-08", producer);

    expect(first).toBe("value");
    expect(second).toBe("value");
    expect(producer).toHaveBeenCalledTimes(1);
    expect(cache.getStats().hits).toBe(1);
  });

  it("falls back to producer when Redis read fails", async () => {
    vi.mocked(isUpstashEnabled).mockReturnValue(true);
    vi.mocked(redisGetJson).mockRejectedValueOnce(new Error("redis down"));
    vi.mocked(redisSetJson).mockResolvedValueOnce(undefined as never);

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const cache = new HybridTTLCache<string>(60_000, "test:hybrid", "test:redis");
    const producer = vi.fn(async () => "from-memory");

    await expect(cache.getOrSet("board:fail", producer)).resolves.toBe("from-memory");
    expect(producer).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("redis-read-failed"),
      "redis down",
    );
    warn.mockRestore();
  });

  it("serves Redis hit without calling producer", async () => {
    vi.mocked(isUpstashEnabled).mockReturnValue(true);
    vi.mocked(redisGetJson).mockResolvedValueOnce("remote-value");

    const cache = new HybridTTLCache<string>(60_000, "test:hybrid", "test:redis");
    const producer = vi.fn(async () => "local");

    await expect(cache.getOrSet("board:remote", producer)).resolves.toBe("remote-value");
    expect(producer).not.toHaveBeenCalled();
  });

  it("keeps memory value when Redis write fails after producer", async () => {
    vi.mocked(isUpstashEnabled).mockReturnValue(true);
    vi.mocked(redisGetJson).mockResolvedValueOnce(null);
    vi.mocked(redisSetJson).mockRejectedValueOnce(new Error("redis write down"));

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const cache = new HybridTTLCache<string>(60_000, "test:hybrid", "test:redis");
    const producer = vi.fn(async () => "persisted-locally");

    await expect(cache.getOrSet("board:write-fail", producer)).resolves.toBe("persisted-locally");
    expect(producer).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("redis-write-failed"),
      "redis write down",
    );

    // L1 still serves without re-producing
    await expect(cache.getOrSet("board:write-fail", producer)).resolves.toBe("persisted-locally");
    expect(producer).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("serves warm L1 without an Upstash round-trip", async () => {
    vi.mocked(isUpstashEnabled).mockReturnValue(true);
    vi.mocked(redisGetJson).mockResolvedValueOnce(null);
    vi.mocked(redisSetJson).mockResolvedValueOnce(undefined as never);

    const cache = new HybridTTLCache<string>(60_000, "test:hybrid", "test:redis");
    const producer = vi.fn(async () => "local-hot");

    await cache.getOrSet("board:l1", producer);
    await cache.getOrSet("board:l1", producer);

    expect(producer).toHaveBeenCalledTimes(1);
    // First miss may hit Redis; second warm L1 must not.
    expect(redisGetJson).toHaveBeenCalledTimes(1);
  });
});
