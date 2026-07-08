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
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("serves a recent last-good snapshot when MLB live feed fails after cache expiry", async () => {
    const { getLiveAtBat } = await import("../server/services/mlb/liveAtBatService");

    mocks.getGameFeed.mockResolvedValueOnce(feedWithPitch(1234));
    const first = await getLiveAtBat(1234);

    expect(first?.play?.batter.name).toBe("Test Batter");
    expect(first?.play?.pitcher.name).toBe("Test Pitcher");
    expect(first?.play?.pitches).toHaveLength(1);

    vi.advanceTimersByTime(13_000);
    mocks.getGameFeed.mockRejectedValueOnce(new Error("MLB feed timeout"));

    const fallback = await getLiveAtBat(1234);

    expect(fallback).toEqual(first);
    expect(mocks.getGameFeed).toHaveBeenCalledTimes(2);
  });
});
