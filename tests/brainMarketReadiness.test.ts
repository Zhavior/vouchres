import { describe, expect, it } from "vitest";
import { buildMarketReadiness } from "../server/services/intelligence/centralBrain/brainScanService";

const evaluatedAt = "2026-07-12T17:00:00.000Z";

describe("Brain market readiness", () => {
  it("calculates each market from its own required evidence", () => {
    const markets = buildMarketReadiness({
      sources: { schedule: 100, rosters: 100, lineups: 100, pitchers: 100, parks: 100, weather: 0, performance: 100, probable_pitchers: 100, season_pitching: 100, recent_pitching: 100 },
      temporalPhase: "lineup_window", decisionWindowOpen: true, evaluatedAt,
    });
    expect(markets.home_run.readiness).toBe(95);
    expect(markets.pitcher_strikeouts.readiness).toBe(85);
    expect(markets.stolen_base.readiness).toBe(75);
    expect(markets.stolen_base.blockers).toEqual([]);
    expect(markets.home_run.blockers).toEqual([]);
  });

  it("reports temporal state independently from evidence percentage", () => {
    const waiting = buildMarketReadiness({ sources: { schedule: 100 }, temporalPhase: "monitoring", decisionWindowOpen: false, evaluatedAt });
    expect(waiting.home_run.state).toBe("waiting_for_window");
    const locked = buildMarketReadiness({ sources: { schedule: 100 }, temporalPhase: "live", decisionWindowOpen: false, evaluatedAt });
    expect(locked.pitcher_strikeouts.state).toBe("locked");
  });
});
