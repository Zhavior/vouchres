import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const redisIncr = vi.fn();
const isUpstashEnabled = vi.fn(() => true);

vi.mock("../server/lib/upstashRedis", () => ({
  isUpstashEnabled: () => isUpstashEnabled(),
  redisIncr: (key: string, ttl: number) => redisIncr(key, ttl),
}));

/**
 * Guards the gap that caused the 2026-08-05 outage: a read-only Upstash token
 * passes every presence check, boots cleanly, then fails every INCR at request
 * time. The probe must exercise the write, not just the connection.
 */
describe("redis write capability probe", () => {
  beforeEach(() => {
    vi.resetModules();
    redisIncr.mockReset();
    isUpstashEnabled.mockReset();
    isUpstashEnabled.mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("reports canWrite when INCR succeeds", async () => {
    redisIncr.mockResolvedValue(1);
    const { probeRedisWriteCapability } = await import("../server/lib/redisCapability");

    const result = await probeRedisWriteCapability();

    expect(result).toMatchObject({ configured: true, canWrite: true, error: null });
    expect(redisIncr).toHaveBeenCalledOnce();
  });

  it("fails a read-only token that answers reads but rejects INCR", async () => {
    redisIncr.mockRejectedValue(
      new Error("NOPERM this user has no permissions to run the 'incr' command"),
    );
    const { probeRedisWriteCapability } = await import("../server/lib/redisCapability");

    const result = await probeRedisWriteCapability();

    expect(result.configured).toBe(true);
    expect(result.canWrite).toBe(false);
    expect(result.error).toContain("NOPERM");
  });

  it("reports unconfigured rather than failing when Redis is absent", async () => {
    isUpstashEnabled.mockReturnValue(false);
    const { probeRedisWriteCapability } = await import("../server/lib/redisCapability");

    const result = await probeRedisWriteCapability();

    expect(result).toMatchObject({ configured: false, canWrite: false, error: null });
    expect(redisIncr).not.toHaveBeenCalled();
  });
});
