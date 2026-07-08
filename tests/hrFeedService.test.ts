import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../server/services/mlb/mlbClient", () => ({
  getScheduleByDate: vi.fn(),
  getGameFeed: vi.fn(),
  todayISO: vi.fn(() => "2026-07-08"),
}));

vi.mock("../server/lib/upstashRedis", () => ({
  isUpstashEnabled: vi.fn(() => false),
  redisGetJson: vi.fn(),
  redisSetJson: vi.fn(),
}));

import { getGameFeed, getScheduleByDate } from "../server/services/mlb/mlbClient";
import { isUpstashEnabled, redisGetJson, redisSetJson } from "../server/lib/upstashRedis";
import {
  getTodayHomeRuns,
  invalidateHrFeedCacheForTests,
  resetHrFeedCachesForTests,
} from "../server/services/mlb/hrFeedService";

describe("getTodayHomeRuns last-good fallback", () => {
  beforeEach(() => {
    resetHrFeedCachesForTests();
    vi.clearAllMocks();
    vi.mocked(isUpstashEnabled).mockReturnValue(false);
  });

  afterEach(() => {
    resetHrFeedCachesForTests();
  });

  it("serves last-known HR events with an honest warning when upstream refresh fails", async () => {
    vi.mocked(getScheduleByDate)
      .mockResolvedValueOnce([
        {
          gamePk: 777001,
          status: "In Progress",
          awayTeam: { name: "BOS", abbreviation: "BOS" },
          homeTeam: { name: "NYY", abbreviation: "NYY" },
        },
      ] as any)
      .mockRejectedValueOnce(new Error("schedule timeout"));

    vi.mocked(getGameFeed).mockResolvedValueOnce({
      liveData: {
        plays: {
          allPlays: [
            {
              result: { eventType: "home_run", description: "Aaron Judge homers", rbi: 1 },
              matchup: { batter: { id: 592450, fullName: "Aaron Judge" } },
              about: { halfInning: "bottom", inning: 3, endTime: "2026-07-08T01:00:00Z" },
              atBatIndex: 1,
            },
          ],
        },
      },
    } as any);

    const first = await getTodayHomeRuns("2026-07-08");
    expect(first.events).toHaveLength(1);
    expect(first.warnings).toEqual([]);

    invalidateHrFeedCacheForTests("2026-07-08");
    const second = await getTodayHomeRuns("2026-07-08");
    expect(second.events).toHaveLength(1);
    expect(second.events[0].playerName).toBe("Aaron Judge");
    expect(second.warnings.join(" ")).toContain("last-known home run feed");
  });

  it("rethrows when upstream fails and no last-good snapshot exists", async () => {
    vi.mocked(getScheduleByDate).mockRejectedValue(new Error("schedule down"));

    await expect(getTodayHomeRuns("2026-07-08")).rejects.toThrow("schedule down");
  });

  it("serves last-good HR feed from Redis when local L1 is empty", async () => {
    vi.mocked(isUpstashEnabled).mockReturnValue(true);
    vi.mocked(getScheduleByDate)
      .mockResolvedValueOnce([
        {
          gamePk: 777001,
          status: "In Progress",
          awayTeam: { name: "BOS", abbreviation: "BOS" },
          homeTeam: { name: "NYY", abbreviation: "NYY" },
        },
      ] as any)
      .mockRejectedValueOnce(new Error("schedule timeout"));

    vi.mocked(getGameFeed).mockResolvedValueOnce({
      liveData: {
        plays: {
          allPlays: [
            {
              result: { eventType: "home_run", description: "Aaron Judge homers", rbi: 1 },
              matchup: { batter: { id: 592450, fullName: "Aaron Judge" } },
              about: { halfInning: "bottom", inning: 3, endTime: "2026-07-08T01:00:00Z" },
              atBatIndex: 1,
            },
          ],
        },
      },
    } as any);

    const first = await getTodayHomeRuns("2026-07-08");
    expect(first.events).toHaveLength(1);
    expect(redisSetJson).toHaveBeenCalled();

    resetHrFeedCachesForTests();
    invalidateHrFeedCacheForTests("2026-07-08");

    const storedAt = Date.now() - 5_000;
    vi.mocked(redisGetJson).mockResolvedValueOnce({ payload: first, storedAt });

    const fallback = await getTodayHomeRuns("2026-07-08");
    expect(fallback.events).toHaveLength(1);
    expect(fallback.warnings.join(" ")).toContain("last-known home run feed");
    expect(redisGetJson).toHaveBeenCalled();
  });
});
