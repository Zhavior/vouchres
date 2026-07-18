import { afterEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../server/errors/AppError";
import { isUpstashEnabled, redisReleaseLock, redisSet, sleep } from "../server/lib/upstashRedis";

vi.mock("../server/lib/upstashRedis", () => ({
  isUpstashEnabled: vi.fn(() => false),
  redisSet: vi.fn(),
  redisReleaseLock: vi.fn(),
  sleep: vi.fn(async () => undefined),
}));

import { runWithDistributedLock } from "../server/lib/distributedLock";

describe("runWithDistributedLock", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.mocked(isUpstashEnabled).mockReturnValue(false);
  });

  it("serializes concurrent holders via in-memory fallback when Redis is disabled", async () => {
    let active = 0;
    let maxActive = 0;
    let releases: (() => void) | null = null;
    const gate = new Promise<void>((resolve) => {
      releases = resolve;
    });

    const work = async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await gate;
      active -= 1;
      return "done";
    };

    const first = runWithDistributedLock("test:memory", work);
    const second = runWithDistributedLock("test:memory", work);
    await Promise.resolve();
    expect(maxActive).toBe(1);

    releases?.();
    const [a, b] = await Promise.all([first, second]);
    expect(a).toBe("done");
    expect(b).toBe("done");
    expect(maxActive).toBe(1);
  });

  it("acquires Redis lock with SET NX and releases via atomic token compare-and-delete", async () => {
    vi.mocked(isUpstashEnabled).mockReturnValue(true);
    let heldToken = "";
    vi.mocked(redisSet).mockImplementation(async (_key, token) => {
      heldToken = String(token);
      return true;
    });
    vi.mocked(redisReleaseLock).mockImplementation(async (_key, token) => token === heldToken);

    const result = await runWithDistributedLock("test:redis", async () => "graded", {
      waitMs: 100,
      pollMs: 10,
    });

    expect(result).toBe("graded");
    expect(redisSet).toHaveBeenCalledWith("lock:test:redis", expect.any(String), {
      nx: true,
      exSeconds: 600,
    });
    expect(redisReleaseLock).toHaveBeenCalledWith("lock:test:redis", heldToken);
  });

  it("throws conflict when Redis lock cannot be acquired before waitMs", async () => {
    vi.mocked(isUpstashEnabled).mockReturnValue(true);
    vi.mocked(redisSet).mockResolvedValue(false);

    await expect(
      runWithDistributedLock("test:busy", async () => "nope", { waitMs: 50, pollMs: 10 }),
    ).rejects.toMatchObject({
      name: "AppError",
      status: 409,
      code: "conflict",
    });

    expect(sleep).toHaveBeenCalled();
  });

  it("uses atomic release so stale holders cannot delete a newer lock", async () => {
    vi.mocked(isUpstashEnabled).mockReturnValue(true);
    vi.mocked(redisSet).mockResolvedValueOnce(true);
    vi.mocked(redisReleaseLock).mockResolvedValueOnce(false);

    await runWithDistributedLock("test:stale", async () => "ok");

    expect(redisReleaseLock).toHaveBeenCalledWith("lock:test:stale", expect.any(String));
  });
});

describe("runWithDistributedLock AppError shape", () => {
  it("exposes conflict to clients", async () => {
    vi.mocked(isUpstashEnabled).mockReturnValue(true);
    vi.mocked(redisSet).mockResolvedValue(false);

    try {
      await runWithDistributedLock("x", async () => null, { waitMs: 0, pollMs: 1 });
      throw new Error("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).expose).toBe(true);
    }
  });
});
