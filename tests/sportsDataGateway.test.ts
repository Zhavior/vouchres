import { afterEach, describe, expect, it, vi } from "vitest";
import { sportsFetchJson } from "../server/lib/sports/sportsHttpClient";
import {
  fetchMlbGameLiveState,
  getSportsDataGatewayStatus,
} from "../server/services/data/sportsDataGateway";

vi.mock("../server/lib/sports/sportsHttpClient", () => ({
  getSportsHttpStats: vi.fn(() => ({ requests: 0 })),
  sportsFetchJson: vi.fn(),
}));

describe("SportsDataGateway", () => {
  afterEach(() => {
    vi.mocked(sportsFetchJson).mockReset();
  });

  it("returns gateway status with provider catalog", () => {
    const status = getSportsDataGatewayStatus();
    expect(status.gateway).toBe("sports_data_v1");
    expect(status.providers.some((p) => p.id === "mlb_stats")).toBe(true);
    expect(status.architecture.hrBoardCanonical).toBe("validated_pipeline");
    expect(status.architecture.clientDirectMlbFallback).toBe("disabled_in_production_by_default");
  });

  it("prefers live feed for game state and counts home runs from play-by-play", async () => {
    const feed = {
      gameData: { status: { detailedState: "In Progress" } },
      liveData: {
        boxscore: {
          teams: {
            away: { players: { ID592450: { stats: { batting: { homeRuns: 1 } } } } },
            home: { players: {} },
          },
        },
        plays: {
          allPlays: [
            {
              result: { eventType: "home_run" },
              matchup: { batter: { id: 592450 } },
            },
          ],
        },
      },
    };

    vi.mocked(sportsFetchJson).mockResolvedValueOnce(feed);

    const state = await fetchMlbGameLiveState("777777");
    expect(state.source).toBe("live_feed");
    expect(state.gameStatus).toBe("In Progress");
    expect(state.hrCountByPlayer["592450"]).toBe(1);
    expect(state.boxscore).toBeTruthy();
  });

  it("falls back to boxscore when live feed is unavailable", async () => {
    vi.mocked(sportsFetchJson)
      .mockRejectedValueOnce(new Error("upstream down"))
      .mockResolvedValueOnce({ status: { detailedState: "Final" } })
      .mockResolvedValueOnce({ teams: {} });

    const state = await fetchMlbGameLiveState("888888");
    expect(state.source).toBe("boxscore_fallback");
    expect(state.gameStatus).toBe("Final");
    expect(state.hrCountByPlayer).toEqual({});
  });
});
