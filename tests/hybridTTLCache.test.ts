import { afterEach, describe, expect, it, vi } from "vitest";
import { HybridTTLCache } from "../server/lib/hybridTTLCache";

vi.mock("../server/lib/upstashRedis", () => ({
  isUpstashEnabled: vi.fn(() => false),
  redisGetJson: vi.fn(),
  redisSetJson: vi.fn(),
}));

describe("HybridTTLCache", () => {
  afterEach(() => {
    vi.clearAllMocks();
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
});
