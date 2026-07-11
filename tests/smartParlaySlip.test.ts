import { describe, expect, it } from "vitest";
import {
  projectSmartParlayFromParlay,
  projectSmartParlayFromPublic,
  draftLegsToParlay,
  canonicalToParlay,
  parlayToCanonical,
} from "../src/domain/parlay";
import { normalizePublicSlip } from "../src/lib/parlayDisplay";
import { mapBackendParlay } from "../src/app/backendMappers";
import type { Parlay } from "../src/types";

describe("smart parlay slip projection", () => {
  it("projects identity-complete legs from saved parlay", () => {
    const parlay: Parlay = {
      id: "parlay-smart-1",
      title: "Judge HR",
      legs: [{
        id: "leg-1",
        sport: "MLB",
        game: "NYY @ BOS",
        market: "Anytime HR",
        selection: "Aaron Judge Anytime HR",
        odds: 310,
        status: "PENDING",
        gamePk: "777001",
        playerId: "592450",
        marketCode: "ANYTIME_HR",
        statTarget: 1,
        comparator: ">=",
        eventKey: "MLB_777001_TEAM_592450_ANYTIME_HR",
      }],
      status: "PENDING",
      mode: "PRACTICE",
      createdAt: new Date().toISOString(),
      totalOdds: "+310",
      oddsValue: 310,
      riskTier: "LOW",
    };

    const smart = projectSmartParlayFromParlay(parlay);
    expect(smart.identity.complete).toBe(true);
    expect(smart.legs[0].identityComplete).toBe(true);
    expect(smart.proofPickId).toBe("parlay-smart-1");
  });

  it("round-trips draft legs through canonical persist shape", () => {
    const saved = draftLegsToParlay({
      title: "2-Leg Parlay",
      legs: [{
        id: "d1",
        source: "manual",
        sport: "MLB",
        selection: "Aaron Judge Anytime HR",
        playerName: "Aaron Judge",
        playerId: "592450",
        gamePk: "777001",
        marketCode: "ANYTIME_HR",
        marketLabel: "Anytime HR",
        statTarget: 1,
        comparator: ">=",
        odds: 300,
      }],
    });

    expect(saved.legs[0].gamePk).toBe("777001");
    expect(saved.legs[0].statTarget).toBe(1);
    expect(saved.legs[0].comparator).toBe(">=");
  });

  it("preserves backend identity fields in mapBackendParlay", () => {
    const mapped = mapBackendParlay({
      id: "uuid-backend-1",
      sport: "mlb",
      status: "pending",
      legs: [{
        id: "leg-backend-1",
        event_id: "777001",
        market: "ANYTIME_HR",
        market_code: "ANYTIME_HR",
        selection: "Aaron Judge Anytime HR",
        player_id: "592450",
        stat_target: 1,
        comparator: ">=",
        event_key: "MLB_777001_TEAM_592450_ANYTIME_HR",
        odds_decimal: 4.1,
        status: "pending",
      }],
    });

    expect(mapped.legs[0].gamePk).toBe("777001");
    expect(mapped.legs[0].statTarget).toBe(1);
    expect(mapped.legs[0].eventKey).toBe("MLB_777001_TEAM_592450_ANYTIME_HR");
    const smart = projectSmartParlayFromParlay(mapped);
    expect(smart.identity.complete).toBe(true);
  });

  it("projects public slip with repair from team abbrev", () => {
    const publicSlip = normalizePublicSlip({
      id: "parlay-pub-1",
      title: "Balanced",
      status: "PENDING",
      legs: [{
        id: "leg-pub-1",
        selection: "Aaron Judge Anytime HR",
        playerId: "592450",
        marketCode: "ANYTIME_HR",
        statTarget: 1,
        comparator: ">=",
        teamLabel: "NYY",
        odds: 300,
      }],
    });

    const smart = projectSmartParlayFromPublic(publicSlip, [{
      id: "777001",
      homeTeam: "New York Yankees",
      awayTeam: "Boston Red Sox",
      status: "Scheduled",
    }]);

    expect(smart.legs[0].gamePk).toBe("777001");
    expect(smart.identity.complete).toBe(true);
  });
});

describe("canonical round trip", () => {
  it("canonicalToParlay preserves grading identity", () => {
    const parlay = draftLegsToParlay({
      title: "Canonical",
      legs: [{
        id: "c1",
        source: "manual",
        sport: "MLB",
        selection: "Aaron Judge Anytime HR",
        playerId: "592450",
        gamePk: "777001",
        marketCode: "ANYTIME_HR",
        statTarget: 1,
        comparator: ">=",
      }],
    });

    const roundTrip = canonicalToParlay(parlayToCanonical(parlay));
    expect(roundTrip.legs[0].eventKey).toBeTruthy();
    expect(roundTrip.legs[0].gamePk).toBe("777001");
  });
});
