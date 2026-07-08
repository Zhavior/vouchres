import { describe, expect, it } from "vitest";
import { parseMlbPeopleResponse, parseMlbRosterResponse, parseMlbScheduleResponse, parseMlbTeamsResponse } from "../server/services/mlb/mlbStatsApiSchemas";
import { buildLiveGamesResponse } from "../server/services/mlb/liveGamesService";

describe("MLB Stats API schedule parsing", () => {
  it("keeps valid games and skips malformed rows", () => {
    const parsed = parseMlbScheduleResponse({
      dates: [{
        games: [
          {
            gamePk: 123,
            gameDate: "2026-07-07T23:00:00Z",
            status: { detailedState: "In Progress" },
            teams: {
              away: { team: { id: 1, name: "Away" }, score: 3 },
              home: { team: { id: 2, name: "Home" }, score: 4 },
            },
          },
          { status: { detailedState: "In Progress" } },
        ],
      }],
    }, "test");

    expect(parsed.games).toHaveLength(1);
    expect(parsed.games[0].gamePk).toBe(123);
    expect(parsed.warnings).toEqual(["test: skipped malformed MLB game row."]);
  });

  it("parses people, teams, and roster responses behind the same boundary", () => {
    expect(parseMlbPeopleResponse({ people: [{ id: 1, fullName: "Player One" }, { fullName: "No ID" }] }, "people")).toMatchObject({
      people: [{ id: 1, fullName: "Player One" }],
      warnings: ["people: skipped malformed MLB person row."],
    });

    expect(parseMlbTeamsResponse({ teams: [{ id: 10, name: "Club", abbreviation: "CLB" }, { name: "Bad" }] }, "teams")).toMatchObject({
      teams: [{ id: 10, name: "Club", abbreviation: "CLB" }],
      warnings: ["teams: skipped malformed MLB team row."],
    });

    expect(parseMlbRosterResponse({ roster: [{ person: { id: 1, fullName: "Hitter" }, position: { abbreviation: "1B" } }, { position: { abbreviation: "2B" } }] }, "roster")).toMatchObject({
      roster: [{ person: { id: 1, fullName: "Hitter" }, position: { abbreviation: "1B" } }],
      warnings: ["roster: skipped malformed MLB roster row."],
    });
  });

  it("builds live responses from validated official schedule data only", () => {
    const response = buildLiveGamesResponse({
      dates: [{
        games: [{
          gamePk: 456,
          gameDate: "2026-07-07T23:00:00Z",
          status: { detailedState: "Player challenge" },
          venue: { name: "Test Park" },
          teams: {
            away: { team: { name: "Away Club" }, score: 5 },
            home: { team: { name: "Home Club" }, score: 6 },
          },
        }],
      }],
    }, "2026-07-07", new Date("2026-07-08T01:00:00Z"));

    expect(response.games).toHaveLength(1);
    expect(response.games[0]).toMatchObject({
      id: "456",
      awayTeam: "Away Club",
      homeTeam: "Home Club",
      awayScore: 5,
      homeScore: 6,
      status: "Player challenge",
      isLive: true,
      venue: "Test Park",
    });
    expect(response.warnings).toContain("Probability fields are unavailable until a backed model is connected; no synthetic projections returned.");
    expect(response.meta).toMatchObject({
      source: "mlb_statsapi_schedule",
      dataQuality: "official_mlb_schedule",
      updatedAt: "2026-07-08T01:00:00.000Z",
      cache: { strategy: "sports_http_ttl_stale_if_error", ttlMs: 45000 },
    });
  });
});
