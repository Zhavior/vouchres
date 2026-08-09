import { describe, expect, it, vi } from "vitest";
import {
  getMarketRadar,
  type MarketRadarDependencies,
} from "../server/services/marketRadar/marketRadarService";
import type { MarketRadarQuote } from "../server/services/marketRadar/types";

const quota = { remaining: 450, used: 50, lastCost: 3 };

function quote(input: Partial<MarketRadarQuote> & Pick<MarketRadarQuote, "market" | "subject">): MarketRadarQuote {
  return {
    eventId: "odds-event-1",
    commenceTime: "2026-08-08T23:00:00.000Z",
    homeTeam: "New York Yankees",
    awayTeam: "Toronto Blue Jays",
    bookmakerKey: "book-a",
    bookmaker: "Book A",
    side: "over",
    point: 0.5,
    price: { american: 150, decimal: 2.5, impliedProbability: 0.4 },
    lastUpdate: "2026-08-08T12:00:00.000Z",
    ...input,
  };
}

function dependencies(quotes: MarketRadarQuote[]): MarketRadarDependencies {
  return {
    now: () => new Date("2026-08-08T12:30:00.000Z"),
    fetchOdds: vi.fn().mockResolvedValue({ events: 1, quotes, quota }),
    signals: {
      pitcherKs: vi.fn().mockResolvedValue([{
        eventId: "123",
        subjectId: "10",
        subject: "Pitcher One",
        team: "NYY",
        opponent: "TOR",
        quality: "partial",
        pitcherCswPercent: 0.3,
        opponentWhiffPercent: 0.24,
        projectedBattersFaced: 22,
      }]),
      homeRuns: vi.fn().mockResolvedValue([{
        eventId: "123",
        subjectId: "20",
        subject: "Hitter Two Jr.",
        team: "NYY",
        opponent: "TOR",
        quality: "full",
        lineupConfirmed: true,
        modelProbability: 0.35,
        pitcherFlyBallPercent: 70,
        pitcherBarrelAllowedPercent: 25,
        parkFactorHr: 140,
      }]),
      stolenBases: vi.fn().mockResolvedValue([{
        eventId: "123",
        subjectId: "30",
        subject: "Runner Three",
        team: "TOR",
        opponent: "NYY",
        quality: "limited",
        lineupConfirmed: true,
        modelProbability: 0.25,
        runnerSprintSpeedFtSec: 26.98,
        catcherPopTime: 2.08,
      }]),
    },
  };
}

describe("getMarketRadar", () => {
  it("joins live prices to MLB signals and ranks current edges", async () => {
    const deps = dependencies([
      quote({ market: "pitcher_strikeouts", subject: "Pitcher One", point: 5.5, price: { american: -105, decimal: 1.9524, impliedProbability: 0.512195 } }),
      quote({ market: "batter_home_runs", subject: "Hitter Two", point: 0.5, price: { american: 250, decimal: 3.5, impliedProbability: 0.285714 } }),
      quote({ market: "batter_home_runs", subject: "Hitter Two", point: 0.5, bookmakerKey: "book-b", bookmaker: "Book B", price: { american: 300, decimal: 4, impliedProbability: 0.25 } }),
      quote({ market: "batter_stolen_bases", subject: "Runner Three", point: 0.5, price: { american: 400, decimal: 5, impliedProbability: 0.2 } }),
    ]);

    const result = await getMarketRadar("2026-08-08", deps);

    expect(result.provider.status).toBe("live");
    expect(result.counts).toEqual({
      pitcher_strikeouts: 1,
      batter_home_runs: 1,
      batter_stolen_bases: 1,
      batter_hits: 0,
      batter_total_bases: 0,
      batter_walks: 0,
    });
    expect(result.edges.map((edge) => edge.market)).toEqual([
      "batter_home_runs",
      "batter_stolen_bases",
      "pitcher_strikeouts",
    ]);
    expect(result.edges.find((edge) => edge.market === "batter_home_runs")?.metrics.hrSusceptibility).toBe(66);
    expect(result.edges.find((edge) => edge.market === "batter_home_runs")?.marketImpliedProbability).toBeCloseTo(0.267857);
    expect(result.edges.find((edge) => edge.market === "batter_home_runs")?.bookmaker).toBe("Book B");
    expect(result.edges.find((edge) => edge.market === "batter_stolen_bases")?.metrics.timingMismatchSeconds).toBe(0.18);
  });

  it("returns a truthful empty slate only after a successful provider response", async () => {
    const deps = dependencies([]);
    const result = await getMarketRadar("2026-08-08", deps);

    expect(result.edges).toEqual([]);
    expect(result.warnings[0]).toContain("no supported player-prop prices");
    expect(deps.signals.pitcherKs).not.toHaveBeenCalled();
  });

  it("selects an available under side when it has the stronger probability edge", async () => {
    const deps = dependencies([
      quote({ market: "batter_home_runs", subject: "Hitter Two", side: "over", price: { american: 250, decimal: 3.5, impliedProbability: 0.285714 } }),
      quote({ market: "batter_home_runs", subject: "Hitter Two", side: "under", price: { american: -125, decimal: 1.8, impliedProbability: 0.555556 } }),
    ]);
    deps.signals.homeRuns = vi.fn().mockResolvedValue([{
      eventId: "123",
      subjectId: "20",
      subject: "Hitter Two",
      team: "NYY",
      opponent: "TOR",
      quality: "full",
      lineupConfirmed: true,
      modelProbability: 0.2,
      pitcherFlyBallPercent: 70,
      pitcherBarrelAllowedPercent: 25,
      parkFactorHr: 140,
    }]);

    const result = await getMarketRadar("2026-08-08", deps);

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].direction).toBe("under");
    expect(result.edges[0].edgeScore).toBeGreaterThan(0);
  });

  it("propagates provider failures instead of returning empty data", async () => {
    const deps = dependencies([]);
    deps.fetchOdds = vi.fn().mockRejectedValue(new Error("HTTP 503"));

    await expect(getMarketRadar("2026-08-08", deps)).rejects.toThrow("HTTP 503");
  });
});
