import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getScheduleByDate: vi.fn(),
  getBoxscore: vi.fn(),
  getPlayerBasics: vi.fn(),
  todayISO: vi.fn(),
  getActiveHittersByTeam: vi.fn(),
  getHitterStats: vi.fn(),
  getPitcherStats: vi.fn(),
  getBatterVsPitcher: vi.fn(),
  getStatcastBatterMapResult: vi.fn(),
  sportsFetchJson: vi.fn(),
}));

vi.mock("../server/services/mlb/mlbClient", () => ({
  getScheduleByDate: mocks.getScheduleByDate,
  getBoxscore: mocks.getBoxscore,
  getPlayerBasics: mocks.getPlayerBasics,
  todayISO: mocks.todayISO,
}));

vi.mock("../server/services/mlb/teamRosterClient", () => ({
  getActiveHittersByTeam: mocks.getActiveHittersByTeam,
}));

vi.mock("../server/services/mlb/statsClient", () => ({
  getHitterStats: mocks.getHitterStats,
  getPitcherStats: mocks.getPitcherStats,
  getBatterVsPitcher: mocks.getBatterVsPitcher,
}));

vi.mock("../server/services/mlb/statcastClient", () => ({
  getStatcastBatterMapResult: mocks.getStatcastBatterMapResult,
}));

vi.mock("../server/lib/sports/sportsHttpClient", () => ({
  sportsFetchJson: mocks.sportsFetchJson,
}));

const game = {
  gamePk: 823062,
  awayTeam: { teamId: 158, name: "Milwaukee Brewers", abbreviation: "MIL" },
  homeTeam: { teamId: 138, name: "St. Louis Cardinals", abbreviation: "STL" },
  probablePitchers: {
    away: { pitcherId: 694819, pitcherName: "Away Pitcher", throws: "R", team: "Milwaukee Brewers", teamId: 158 },
    home: null,
  },
};

describe("getPitcherMatchup", () => {
  beforeEach(async () => {
    vi.resetModules();
    Object.values(mocks).forEach((mock) => mock.mockReset());

    const { reportCache } = await import("../server/services/mlb/mlbCache");
    reportCache.clear();

    mocks.todayISO.mockReturnValue("2026-07-08");
    mocks.getScheduleByDate.mockImplementation(async (date: string) => (date === "2026-07-07" ? [game] : []));
    mocks.getPlayerBasics.mockResolvedValue({
      playerId: 694819,
      playerName: "Away Pitcher",
      throws: "R",
      team: "Milwaukee Brewers",
    });
    mocks.getPitcherStats.mockResolvedValue({ season: null, recentGames: [] });
    mocks.getBoxscore.mockResolvedValue(null);
    mocks.getActiveHittersByTeam.mockResolvedValue(
      new Map([
        [
          138,
          [
            {
              playerId: 100,
              playerName: "Opponent Batter",
              position: "1B",
              bats: "L",
              team: "St. Louis Cardinals",
              teamId: 138,
              headshot: "",
            },
          ],
        ],
      ])
    );
    mocks.getHitterStats.mockResolvedValue(null);
    mocks.getBatterVsPitcher.mockResolvedValue(null);
    mocks.getStatcastBatterMapResult.mockResolvedValue({ map: {}, feedStatus: "ok" });
    mocks.sportsFetchJson.mockResolvedValue({ people: [] });
  });

  it("finds the game on a nearby date instead of returning a false 404 after date rollover", async () => {
    const { getPitcherMatchup } = await import("../server/services/mlb/pitcherMatchupService");

    const matchup = await getPitcherMatchup(823062, 694819, "2026-07-08");

    expect(matchup).toMatchObject({
      gamePk: 823062,
      pitcher: {
        id: 694819,
        team: "Milwaukee Brewers",
      },
      opponent: {
        team: "St. Louis Cardinals",
      },
    });
    expect(matchup?.warnings).toContain("Game found on 2026-07-07; requested date was 2026-07-08.");
    expect(matchup?.opponent.projectedLineup[0]).toMatchObject({
      id: 100,
      name: "Opponent Batter",
    });
    expect(mocks.getScheduleByDate).toHaveBeenCalledWith("2026-07-08");
    expect(mocks.getScheduleByDate).toHaveBeenCalledWith("2026-07-07");
  });
});
