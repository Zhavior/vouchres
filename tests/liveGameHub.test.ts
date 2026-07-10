import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getGameFeed: vi.fn(),
}));

vi.mock("../server/services/mlb/mlbClient", () => ({
  getGameFeed: mocks.getGameFeed,
}));

vi.mock("../server/lib/upstashRedis", () => ({
  isUpstashEnabled: vi.fn(() => false),
  redisGetJson: vi.fn(),
  redisSetJson: vi.fn(),
}));

vi.mock("../server/lib/sports/sportsHttpClient", () => ({
  sportsFetchJson: vi.fn().mockResolvedValue([]),
}));

function liveFeed(gamePk: number, awayRuns: number, homeRuns: number) {
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
        currentInning: 7,
        inningHalf: "Top",
        outs: 2,
        teams: { away: { runs: awayRuns }, home: { runs: homeRuns } },
      },
      plays: { allPlays: [], currentPlay: null },
      boxscore: null,
    },
  };
}

describe("liveGameHub", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-08T20:00:00.000Z"));
    mocks.getGameFeed.mockReset();
  });

  afterEach(async () => {
    vi.useRealTimers();
    const { resetLiveGameHubForTests } = await import("../server/services/hubs/liveGameHub");
    resetLiveGameHubForTests();
    vi.clearAllMocks();
  });

  it("coalesces concurrent getSharedGameFeed calls into one upstream fetch", async () => {
    vi.useRealTimers();
    const { getSharedGameFeed, resetLiveGameHubForTests } = await import("../server/services/hubs/liveGameHub");
    resetLiveGameHubForTests();

    mocks.getGameFeed.mockResolvedValue(liveFeed(777, 4, 3));

    const [first, second] = await Promise.all([getSharedGameFeed(777), getSharedGameFeed(777)]);

    expect(mocks.getGameFeed).toHaveBeenCalledTimes(1);
    expect(first.score.awayScore).toBe(4);
    expect(first.score.homeScore).toBe(3);
    expect(second.score).toEqual(first.score);

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-08T20:00:00.000Z"));
  });

  it("serves stale snapshot while refreshing after TTL expires within SWR window", async () => {
    const { getSharedGameFeed, expireLiveGameHubCacheForTests } = await import("../server/services/hubs/liveGameHub");

    mocks.getGameFeed
      .mockResolvedValueOnce(liveFeed(777, 4, 3))
      .mockResolvedValueOnce(liveFeed(777, 5, 3));

    const first = await getSharedGameFeed(777);
    expect(first.score.awayScore).toBe(4);

    vi.advanceTimersByTime(5_000);
    expireLiveGameHubCacheForTests(777);

    const stale = await getSharedGameFeed(777);
    expect(stale.servedStale).toBe(true);
    expect(stale.score.awayScore).toBe(4);

    await vi.runAllTimersAsync();
    const fresh = await getSharedGameFeed(777);
    expect(fresh.score.awayScore).toBe(5);
  });

  it("parses consistent scores for schedule overlay and at-bat snapshot", async () => {
    const { getSharedGameFeed, parseLiveScoreFromFeed, resetLiveGameHubForTests } = await import("../server/services/hubs/liveGameHub");
    const { getLiveAtBat, resetLiveAtBatCachesForTests } = await import("../server/services/mlb/liveAtBatService");

    const feed = liveFeed(888, 6, 5);
    feed.liveData.plays = {
      allPlays: [],
      currentPlay: {
        result: { description: "Ground out" },
        about: { isComplete: true },
        matchup: {
          batter: { id: 10, fullName: "Test Batter" },
          pitcher: { id: 20, fullName: "Test Pitcher" },
        },
        playEvents: [
          {
            isPitch: true,
            details: { description: "Ball", isBall: true, isStrike: false, isInPlay: false },
            pitchData: { startSpeed: 92, coordinates: { pX: 0, pZ: 2.5 }, strikeZoneTop: 3.4, strikeZoneBottom: 1.6 },
          },
        ],
      },
    };
    feed.liveData.linescore.offense = { balls: 1, strikes: 2 };

    mocks.getGameFeed.mockResolvedValue(feed);

    const shared = await getSharedGameFeed(888);
    const parsed = parseLiveScoreFromFeed(feed, 888);
    const atBat = await getLiveAtBat(888);

    expect(shared.score.homeScore).toBe(parsed.homeScore);
    expect(shared.score.awayScore).toBe(parsed.awayScore);
    expect(atBat?.home.runs).toBe(parsed.homeScore);
    expect(atBat?.away.runs).toBe(parsed.awayScore);
    expect(atBat?.inning).toBe(parsed.inning);
    expect(atBat?.outs).toBe(parsed.outs);

    resetLiveGameHubForTests();
    resetLiveAtBatCachesForTests();
  });
});
