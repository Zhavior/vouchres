import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getGameFeed: vi.fn(),
  sportsFetchJson: vi.fn(),
}));

vi.mock("../server/services/mlb/mlbClient", () => ({
  getGameFeed: mocks.getGameFeed,
}));

vi.mock("../server/lib/sports/sportsHttpClient", () => ({
  sportsFetchJson: mocks.sportsFetchJson,
}));

vi.mock("../server/lib/upstashRedis", () => ({
  isUpstashEnabled: vi.fn(() => false),
  redisGetJson: vi.fn(),
  redisSetJson: vi.fn(),
}));

import { isUpstashEnabled, redisGetJson, redisSetJson } from "../server/lib/upstashRedis";

function feedWithPitch(gamePk: number) {
  return {
    gameData: {
      status: { detailedState: "In Progress" },
      teams: {
        away: { id: 111, abbreviation: "AWY" },
        home: { id: 222, abbreviation: "HOM" },
      },
    },
    liveData: {
      linescore: {
        currentInning: 6,
        inningHalf: "Top",
        outs: 1,
        teams: {
          away: { runs: 4 },
          home: { runs: 3 },
        },
        offense: {
          balls: 2,
          strikes: 1,
          first: { id: 30, fullName: "Runner One" },
          third: { id: 31, fullName: "Runner Three" },
        },
      },
      boxscore: {
        teams: {
          away: {
            players: {
              ID10: { stats: { batting: { hits: 2, atBats: 3 } } },
            },
          },
          home: {
            players: {
              ID20: { stats: { pitching: { inningsPitched: "5.2", strikeOuts: 7, earnedRuns: 2, numberOfPitches: 81 } } },
            },
          },
        },
      },
      plays: {
        currentPlay: {
          result: { description: "Single to center" },
          about: { isComplete: true },
          matchup: {
            batter: { id: 10, fullName: "Test Batter" },
            pitcher: { id: 20, fullName: "Test Pitcher" },
          },
          playEvents: [
            {
              isPitch: true,
              details: { description: "Called Strike", isStrike: true, isBall: false, isInPlay: false, type: { description: "Four-Seam Fastball" } },
              pitchData: { startSpeed: 97.1, coordinates: { pX: 0.11, pZ: 2.7 }, strikeZoneTop: 3.4, strikeZoneBottom: 1.6 },
            },
          ],
        },
        allPlays: [],
      },
    },
  };
}

describe("getLiveAtBat", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-08T20:00:00.000Z"));
    mocks.getGameFeed.mockReset();
    mocks.sportsFetchJson.mockReset();
    mocks.sportsFetchJson.mockResolvedValue([]);
    vi.mocked(isUpstashEnabled).mockReturnValue(false);
  });

  afterEach(async () => {
    vi.useRealTimers();
    const { resetLiveAtBatCachesForTests } = await import("../server/services/mlb/liveAtBatService");
    const { resetLiveGameHubForTests } = await import("../server/services/hubs/liveGameHub");
    resetLiveAtBatCachesForTests();
    resetLiveGameHubForTests();
    vi.clearAllMocks();
  });

  it("serves a recent last-good snapshot when MLB live feed fails after cache expiry", async () => {
    const { getLiveAtBat } = await import("../server/services/mlb/liveAtBatService");

    mocks.getGameFeed.mockResolvedValueOnce(feedWithPitch(1234));
    const first = await getLiveAtBat(1234);

    expect(first?.play?.batter.name).toBe("Test Batter");
    expect(first?.play?.pitcher.name).toBe("Test Pitcher");
    expect(first?.play?.pitches).toHaveLength(1);
    expect(first?.count).toEqual({ balls: 2, strikes: 1 });
    expect(first?.runners.first?.name).toBe("Runner One");
    expect(first?.runners.first?.initials).toBe("RO");
    expect(first?.runners.second).toBeNull();
    expect(first?.runners.third?.name).toBe("Runner Three");

    vi.advanceTimersByTime(5_000);
    mocks.getGameFeed.mockRejectedValueOnce(new Error("MLB feed timeout"));

    const fallback = await getLiveAtBat(1234);

    expect(fallback).toEqual(first);
    expect(mocks.getGameFeed).toHaveBeenCalledTimes(2);
  });

  it("serves last-good snapshot from Redis when local L1 is empty", async () => {
    vi.mocked(isUpstashEnabled).mockReturnValue(true);
    const { getLiveAtBat, resetLiveAtBatCachesForTests } = await import("../server/services/mlb/liveAtBatService");

    mocks.getGameFeed.mockResolvedValueOnce(feedWithPitch(1234));
    const first = await getLiveAtBat(1234);
    expect(first?.play?.batter.name).toBe("Test Batter");
    expect(redisSetJson).toHaveBeenCalled();

    resetLiveAtBatCachesForTests();
    vi.advanceTimersByTime(5_000);

    const storedAt = Date.now() - 5_000;
    vi.mocked(redisGetJson).mockResolvedValueOnce({ snapshot: first, storedAt });
    mocks.getGameFeed.mockRejectedValueOnce(new Error("MLB feed timeout"));

    const fallback = await getLiveAtBat(1234);
    expect(fallback).toEqual(first);
    expect(redisGetJson).toHaveBeenCalled();
  });
});
