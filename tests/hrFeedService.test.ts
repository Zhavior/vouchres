import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../server/services/mlb/mlbClient", () => ({
  getScheduleByDate: vi.fn(),
  getGameFeed: vi.fn(),
  todayISO: vi.fn(() => "2026-07-08"),
}));

import { getGameFeed, getScheduleByDate } from "../server/services/mlb/mlbClient";
import {
  getTodayHomeRuns,
  invalidateHrFeedCacheForTests,
  resetHrFeedCachesForTests,
} from "../server/services/mlb/hrFeedService";

describe("getTodayHomeRuns last-good fallback", () => {
  beforeEach(() => {
    resetHrFeedCachesForTests();
    vi.clearAllMocks();
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
});
