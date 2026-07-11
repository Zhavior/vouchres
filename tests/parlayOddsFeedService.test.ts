import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  fetchLiveTierOdds,
  fetchLiveTierOddsBatch,
  mapTierToOddsApiMarket,
  teamMatchesOddsApiName,
} from "../server/services/mlb/parlayOddsFeedService";

describe("parlayOddsFeedService", () => {
  const originalKey = process.env.ODDS_API_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.ODDS_API_KEY;
    else process.env.ODDS_API_KEY = originalKey;
  });

  it("maps ParlayOS tiers to Odds API markets", () => {
    expect(mapTierToOddsApiMarket("ANYTIME_HR", 1)).toEqual({
      marketKey: "batter_home_runs",
      overPoint: 0.5,
    });
    expect(mapTierToOddsApiMarket("STOLEN_BASE", 1)).toEqual({
      marketKey: "batter_stolen_bases",
      overPoint: 0.5,
    });
    expect(mapTierToOddsApiMarket("RBI", 2)).toEqual({
      marketKey: "batter_rbis_alternate",
      overPoint: 1.5,
    });
    expect(mapTierToOddsApiMarket("UNKNOWN", 1)).toBeNull();
  });

  it("matches team abbreviations to Odds API full names", () => {
    expect(teamMatchesOddsApiName("NYY", "New York Yankees")).toBe(true);
    expect(teamMatchesOddsApiName("yankees", "New York Yankees")).toBe(true);
    expect(teamMatchesOddsApiName("LAD", "Los Angeles Dodgers")).toBe(true);
  });

  it("returns TBD when ODDS_API_KEY is missing", async () => {
    delete process.env.ODDS_API_KEY;
    const quote = await fetchLiveTierOdds({
      playerName: "Aaron Judge",
      teamName: "NYY",
      marketCode: "ANYTIME_HR",
      statTarget: 1,
    });
    expect(quote.source).toBe("tbd");
    expect(quote.odds).toBeNull();
  });

  it("returns TBD for unmapped markets without calling network", async () => {
    process.env.ODDS_API_KEY = "test-key";
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const quote = await fetchLiveTierOdds({
      playerName: "Player",
      teamName: "NYY",
      marketCode: "FAKE_MARKET",
      statTarget: 1,
    });
    expect(quote.source).toBe("tbd");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("uses event-odds endpoint and returns live price when matched", async () => {
    process.env.ODDS_API_KEY = "test-key";

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/events?")) {
        return new Response(JSON.stringify([
          {
            id: "evt-1",
            home_team: "New York Yankees",
            away_team: "Boston Red Sox",
          },
        ]), { status: 200 });
      }
      if (url.includes("/events/evt-1/odds")) {
        return new Response(JSON.stringify({
          bookmakers: [{
            title: "DraftKings",
            markets: [{
              key: "batter_home_runs",
              outcomes: [
                { name: "Over", description: "Aaron Judge", price: 420, point: 0.5 },
              ],
            }],
          }],
        }), { status: 200 });
      }
      return new Response("{}", { status: 404 });
    });

    const quotes = await fetchLiveTierOddsBatch({
      playerName: "Aaron Judge",
      teamName: "NYY",
      tiers: [{ key: "hr_anytime", marketCode: "ANYTIME_HR", statTarget: 1 }],
    });

    expect(quotes.hr_anytime.source).toBe("live");
    expect(quotes.hr_anytime.odds).toBe(420);
  });
});
