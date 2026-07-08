import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../server/lib/sports/sportsHttpClient", () => ({
  sportsFetchJson: vi.fn(),
}));

vi.mock("../server/lib/upstashRedis", () => ({
  isUpstashEnabled: vi.fn(() => false),
  redisGetJson: vi.fn(),
  redisSetJson: vi.fn(),
}));

import { sportsFetchJson } from "../server/lib/sports/sportsHttpClient";
import { isUpstashEnabled, redisGetJson, redisSetJson } from "../server/lib/upstashRedis";
import {
  getTodayLineups,
  invalidateLineupCacheForTests,
  resetLineupCachesForTests,
} from "../server/services/mlb/lineupService";

const schedulePayload = {
  dates: [
    {
      games: [
        {
          gamePk: 777001,
          gameDate: "2026-07-08T23:05:00Z",
          status: { detailedState: "Pre-Game" },
          venue: { name: "Yankee Stadium" },
          teams: {
            away: {
              team: { id: 111, name: "Boston Red Sox", abbreviation: "BOS" },
              probablePitcher: { id: 5001, fullName: "Away Pitcher", pitchHand: { code: "R" } },
            },
            home: {
              team: { id: 147, name: "New York Yankees", abbreviation: "NYY" },
              probablePitcher: { id: 5002, fullName: "Home Pitcher", pitchHand: { code: "L" } },
            },
          },
          lineups: {
            awayPlayers: [{ id: 6001, fullName: "Away Hitter", primaryPosition: { abbreviation: "DH" }, batSide: { code: "L" } }],
            homePlayers: [{ id: 6002, fullName: "Home Hitter", primaryPosition: { abbreviation: "1B" }, batSide: { code: "R" } }],
          },
        },
      ],
    },
  ],
};

const peoplePayload = {
  people: [
    { id: 6001, fullName: "Away Hitter", batSide: { code: "L" }, pitchHand: { code: "R" } },
    { id: 6002, fullName: "Home Hitter", batSide: { code: "R" }, pitchHand: { code: "R" } },
    { id: 5001, fullName: "Away Pitcher", batSide: { code: "R" }, pitchHand: { code: "R" } },
    { id: 5002, fullName: "Home Pitcher", batSide: { code: "L" }, pitchHand: { code: "L" } },
  ],
};

describe("getTodayLineups last-good fallback", () => {
  beforeEach(() => {
    resetLineupCachesForTests();
    vi.clearAllMocks();
    vi.mocked(isUpstashEnabled).mockReturnValue(false);
  });

  afterEach(() => {
    resetLineupCachesForTests();
  });

  it("serves last-known lineups with an honest warning when upstream refresh fails", async () => {
    vi.mocked(sportsFetchJson)
      .mockResolvedValueOnce(schedulePayload)
      .mockResolvedValueOnce(peoplePayload)
      .mockRejectedValueOnce(new Error("statsapi timeout"));

    const first = await getTodayLineups("2026-07-08");
    expect(first.lineups).toHaveLength(1);
    expect(first.lineups[0].awayLineup[0].playerName).toBe("Away Hitter");
    expect(first.lineups[0].lineupConfirmed).toBe(true);
    expect(first.warnings).toEqual([]);

    invalidateLineupCacheForTests("2026-07-08");
    const second = await getTodayLineups("2026-07-08");
    expect(second.lineups).toHaveLength(1);
    expect(second.servedFromLastGood).toBe(true);
    expect(second.warnings.join(" ")).toContain("last-known lineup board");
    expect(second.lineups[0].lineupConfirmed).toBe(true);
  });

  it("rethrows when upstream fails and no last-good snapshot exists", async () => {
    vi.mocked(sportsFetchJson).mockRejectedValue(new Error("statsapi down"));

    await expect(getTodayLineups("2026-07-08")).rejects.toThrow("statsapi down");
  });

  it("serves last-good lineups from Redis when local L1 is empty", async () => {
    vi.mocked(isUpstashEnabled).mockReturnValue(true);
    vi.mocked(sportsFetchJson)
      .mockResolvedValueOnce(schedulePayload)
      .mockResolvedValueOnce(peoplePayload)
      .mockRejectedValueOnce(new Error("statsapi timeout"));

    const first = await getTodayLineups("2026-07-08");
    expect(first.lineups).toHaveLength(1);
    expect(redisSetJson).toHaveBeenCalled();

    resetLineupCachesForTests();
    invalidateLineupCacheForTests("2026-07-08");

    const storedAt = Date.now() - 5_000;
    vi.mocked(redisGetJson).mockResolvedValueOnce({ lineups: first.lineups, storedAt });

    const fallback = await getTodayLineups("2026-07-08");
    expect(fallback.servedFromLastGood).toBe(true);
    expect(fallback.warnings.join(" ")).toContain("last-known lineup board");
    expect(redisGetJson).toHaveBeenCalled();
  });
});
