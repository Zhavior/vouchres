/**
 * Automated soak coverage for multi-instance grade-due safety and grading idempotency.
 * Complements distributedLock.test.ts and gradePendingPicks.test.ts for productionProof.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../server/errors/AppError";
import { isUpstashEnabled, redisReleaseLock, redisSet, sleep } from "../server/lib/upstashRedis";

vi.mock("../server/lib/upstashRedis", () => ({
  isUpstashEnabled: vi.fn(() => false),
  redisSet: vi.fn(),
  redisReleaseLock: vi.fn(),
  sleep: vi.fn(async () => undefined),
}));

const getSupabaseAdmin = vi.fn();

vi.mock("../server/middleware/auth", () => ({
  getSupabaseAdmin: () => getSupabaseAdmin(),
}));

vi.mock("../server/lib/sports/sportsHttpClient", () => ({
  sportsFetchJson: vi.fn(),
}));

const gradePick = vi.fn();

vi.mock("../server/services/persistence/pickService", () => ({
  gradePick: (...args: unknown[]) => gradePick(...args),
}));

vi.mock("../server/services/notifications/notificationService", () => ({
  createParlayGradedNotification: vi.fn(),
}));

import { runWithDistributedLock } from "../server/lib/distributedLock";
import { gradePendingPicks } from "../server/services/grading/gradingService";

describe("grading soak — multi-instance lock safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isUpstashEnabled).mockReturnValue(false);
  });

  it("serializes two concurrent Redis lock attempts so only one holder runs at a time", async () => {
    vi.mocked(isUpstashEnabled).mockReturnValue(true);
    vi.mocked(sleep).mockImplementation(async (ms) => {
      await new Promise((resolve) => setTimeout(resolve, ms));
    });

    let heldToken = "";
    let active = 0;
    let maxActive = 0;

    vi.mocked(redisSet).mockImplementation(async (_key, token) => {
      if (heldToken) return false;
      heldToken = String(token);
      return true;
    });
    vi.mocked(redisReleaseLock).mockImplementation(async (_key, token) => {
      if (heldToken !== String(token)) return false;
      heldToken = "";
      return true;
    });

    const work = async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 25));
      active -= 1;
      return "graded";
    };

    const first = runWithDistributedLock("grading:soak", work, { waitMs: 5_000, pollMs: 5 });
    await Promise.resolve();
    const second = runWithDistributedLock("grading:soak", work, { waitMs: 5_000, pollMs: 5 });
    await Promise.resolve();
    expect(maxActive).toBe(1);

    const [a, b] = await Promise.all([first, second]);
    expect(a).toBe("graded");
    expect(b).toBe("graded");
    expect(maxActive).toBe(1);
  }, 10_000);

  it("returns conflict when a second instance cannot acquire the Redis lock in time", async () => {
    vi.mocked(isUpstashEnabled).mockReturnValue(true);
    vi.mocked(redisSet).mockResolvedValue(false);

    await expect(
      runWithDistributedLock("grading:busy", async () => "nope", { waitMs: 20, pollMs: 5 }),
    ).rejects.toMatchObject({
      name: "AppError",
      status: 409,
      code: "conflict",
    });

    expect(sleep).toHaveBeenCalled();
  });
});

describe("grading soak — gradePendingPicks coalescing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isUpstashEnabled).mockReturnValue(false);
  });

  it("coalesces concurrent grade-due callers onto one pending-picks query", async () => {
    let releases: (() => void) | null = null;
    const gate = new Promise<void>((resolve) => {
      releases = resolve;
    });
    const limit = vi.fn(async () => {
      await gate;
      return { data: [], error: null };
    });
    const order = vi.fn(() => ({ limit }));
    const gte = vi.fn(() => ({ order }));
    const not = vi.fn(() => ({ gte }));
    const eq = vi.fn(() => ({ not }));
    const select = vi.fn(() => ({ eq }));
    getSupabaseAdmin.mockResolvedValue({
      from: vi.fn(() => ({ select })),
    });

    const first = gradePendingPicks({ days: 1 });
    const second = gradePendingPicks({ days: 1 });
    await Promise.resolve();
    expect(select).toHaveBeenCalledTimes(1);

    releases?.();
    const [a, b] = await Promise.all([first, second]);
    expect(a).toEqual(b);
    expect(select).toHaveBeenCalledTimes(1);
  });
});

describe("grading soak — idempotent pending-query contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isUpstashEnabled).mockReturnValue(false);
    gradePick.mockReset();
  });

  it("does not re-grade when the second run finds no pending picks", async () => {
    const limit = vi
      .fn()
      .mockResolvedValueOnce({
        data: [
          {
            id: "pick-1",
            user_id: "user-1",
            market: "hr",
            selection: "Aaron Judge 1+ HR",
            event_id: "99999",
            odds_decimal: 2.0,
            stake_units: 1,
            leg_type: "player",
            sport: "mlb",
            created_at: new Date().toISOString(),
            game_date: "2026-07-08",
            graded_at: null,
            status: "pending",
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({ data: [], error: null });

    const order = vi.fn(() => ({ limit }));
    const gte = vi.fn(() => ({ order }));
    const not = vi.fn(() => ({ gte }));
    const eq = vi.fn(() => ({ not }));
    const select = vi.fn(() => ({ eq }));
    getSupabaseAdmin.mockResolvedValue({
      from: vi.fn(() => ({ select })),
    });

    const { sportsFetchJson } = await import("../server/lib/sports/sportsHttpClient");
    vi.mocked(sportsFetchJson).mockImplementation(async (url: string) => {
      if (url.includes("/schedule")) {
        return {
          dates: [
            {
              games: [
                {
                  gamePk: 99999,
                  status: { detailedState: "Final", abstractGameState: "Final" },
                  officialDate: "2026-07-08",
                },
              ],
            },
          ],
        };
      }
      if (url.includes("/boxscore")) {
        return {
          teams: {
            away: {
              players: {
                ID123: {
                  person: { fullName: "Aaron Judge" },
                  stats: { batting: { homeRuns: 1, rbi: 1, runs: 1, atBats: 4 } },
                },
              },
            },
            home: { players: {} },
          },
        };
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    const first = await gradePendingPicks({ days: 1, dryRun: true });
    expect(first.graded).toHaveLength(1);

    const second = await gradePendingPicks({ days: 1, dryRun: true });
    expect(second.graded).toHaveLength(0);
    expect(second.skipped).toHaveLength(0);
    expect(gradePick).not.toHaveBeenCalled();
  });

  it("surfaces AppError when pending fetch fails (fail-closed)", async () => {
    const limit = vi.fn(async () => ({ data: null, error: { message: "db down" } }));
    const order = vi.fn(() => ({ limit }));
    const gte = vi.fn(() => ({ order }));
    const not = vi.fn(() => ({ gte }));
    const eq = vi.fn(() => ({ not }));
    const select = vi.fn(() => ({ eq }));
    getSupabaseAdmin.mockResolvedValue({
      from: vi.fn(() => ({ select })),
    });

    await expect(gradePendingPicks({ days: 1 })).rejects.toBeInstanceOf(AppError);
  });
});
