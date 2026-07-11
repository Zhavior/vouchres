import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fetchLiveTierOdds } from "../server/services/mlb/parlayOddsFeedService";

describe("parlayOddsFeedService", () => {
  const originalKey = process.env.ODDS_API_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.ODDS_API_KEY;
    else process.env.ODDS_API_KEY = originalKey;
  });

  it("returns TBD when ODDS_API_KEY is missing", async () => {
    delete process.env.ODDS_API_KEY;
    const quote = await fetchLiveTierOdds({
      playerName: "Aaron Judge",
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
      marketCode: "RBI",
      statTarget: 1,
    });
    expect(quote.source).toBe("tbd");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
