import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getScheduleByDate: vi.fn(),
  getSharedGameFeed: vi.fn(),
}));

vi.mock("../server/services/mlb/mlbClient", () => ({
  getScheduleByDate: mocks.getScheduleByDate,
  todayISO: () => "2026-07-08",
}));

vi.mock("../server/services/hubs/liveGameHub", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../server/services/hubs/liveGameHub")>();
  return {
    ...actual,
    getSharedGameFeed: mocks.getSharedGameFeed,
  };
});

import { buildLiveGamesResponse, getLiveGames } from "../server/services/mlb/liveGamesService";
import { resetLiveGameHubForTests } from "../server/services/hubs/liveGameHub";

describe("buildLiveGamesResponse", () => {
  it("normalizes official MLB schedule games without synthetic predictions", () => {
    const response = buildLiveGamesResponse(
      {
        dates: [
          {
            games: [
              {
                gamePk: 777,
                gameDate: "2026-07-07T23:05:00Z",
                status: { detailedState: "In Progress" },
                teams: {
                  away: { team: { name: "Boston Red Sox" }, score: 4 },
                  home: { team: { name: "New York Yankees" }, score: 2 },
                },
                venue: { name: "Yankee Stadium" },
              },
            ],
          },
        ],
      },
      "2026-07-07",
      new Date("2026-07-07T12:00:00Z")
    );

    expect(response.isRealApi).toBe(true);
    expect(response.dataQuality).toBe("official_mlb_schedule");
    expect(response.games).toHaveLength(1);
    expect(response.games[0]).toMatchObject({
      id: "777",
      awayTeam: "Boston Red Sox",
      homeTeam: "New York Yankees",
      awayScore: 4,
      homeScore: 2,
      predictionsAvailable: false,
      predictionStatus: "unavailable",
      predictionSource: "not_computed",
    });
    expect(response.games[0].predictions.winningPct.home).toBeNull();
    expect(response.games[0].predictions.hrPct.away).toBeNull();
  });

  it("returns an honest empty official schedule instead of mock games", () => {
    const response = buildLiveGamesResponse(
      { dates: [{ games: [] }] },
      "2026-12-25",
      new Date("2026-12-25T12:00:00Z")
    );

    expect(response.success).toBe(true);
    expect(response.isRealApi).toBe(false);
    expect(response.dataQuality).toBe("official_mlb_empty_schedule");
    expect(response.games).toEqual([]);
    expect(response.warnings.join(" ")).toContain("no mock games");
  });
});

describe("getLiveGames hub overlay", () => {
  beforeEach(() => {
    mocks.getScheduleByDate.mockReset();
    mocks.getSharedGameFeed.mockReset();
  });

  afterEach(() => {
    resetLiveGameHubForTests();
    vi.clearAllMocks();
  });

  it("overlays live feed scores onto in-progress schedule games", async () => {
    mocks.getScheduleByDate.mockResolvedValue([
      {
        gamePk: 777,
        gameDate: "2026-07-08T23:05:00Z",
        status: "In Progress",
        awayTeam: { teamId: 111, name: "Boston Red Sox", abbreviation: "BOS" },
        homeTeam: { teamId: 222, name: "New York Yankees", abbreviation: "NYY" },
        venue: "Yankee Stadium",
        score: { away: 2, home: 1 },
        probablePitchers: { away: null, home: null },
        inning: 5,
        linescore: null,
        weather: null,
        bettingContext: null,
        aiContext: null,
        dataQuality: "partial",
      },
    ]);

    mocks.getSharedGameFeed.mockResolvedValue({
      gamePk: 777,
      feed: {},
      asOf: "2026-07-08T22:30:00.000Z",
      score: {
        gamePk: 777,
        awayScore: 4,
        homeScore: 3,
        inning: 6,
        halfInning: "Top",
        outs: 1,
        status: "In Progress",
        asOf: "2026-07-08T22:30:00.000Z",
      },
    });

    const response = await getLiveGames("2026-07-08");

    expect(response.games[0]).toMatchObject({
      id: "777",
      awayScore: 4,
      homeScore: 3,
    });
    expect(response.meta.cache).toMatchObject({
      strategy: "live_game_hub_swr",
      ttlMs: 4_500,
      asOf: "2026-07-08T22:30:00.000Z",
    });
    expect(mocks.getSharedGameFeed).toHaveBeenCalledWith(777);
  });
});
