import { describe, expect, it } from "vitest";
import { normalizePublicSlip } from "../src/lib/parlayDisplay";
import { assessClientParlayIdentity } from "../src/lib/parlayIdentity";
import { repairAllSavedParlays } from "../src/lib/parlays/repairSavedParlay";
import type { Parlay } from "../src/types";

describe("saved parlay identity", () => {
  it("preserves grading fields when normalizing public slips", () => {
    const slip = normalizePublicSlip({
      id: "parlay-1",
      title: "Focused Parlay",
      status: "PENDING",
      legs: [{
        id: "leg-1",
        selection: "Aaron Judge Anytime HR",
        playerName: "Aaron Judge",
        playerId: "592450",
        marketCode: "ANYTIME_HR",
        market: "To Hit a Home Run (Anytime)",
        statTarget: 1,
        comparator: ">=",
        gamePk: "777001",
        teamLabel: "NYY",
        odds: 310,
        status: "PENDING",
      }],
    });

    const identity = assessClientParlayIdentity(slip.legs as unknown as Record<string, unknown>[]);
    expect(identity.complete).toBe(true);
  });

  it("repairs saved parlay legs missing gamePk from team abbrev", () => {
    const parlays: Parlay[] = [{
      id: "parlay-2",
      title: "Balanced Parlay",
      legs: [{
        id: "leg-2",
        sport: "MLB",
        game: "Boston Red Sox @ New York Yankees",
        market: "Anytime HR",
        selection: "Aaron Judge Anytime HR",
        odds: 300,
        status: "PENDING",
        playerId: "592450",
        marketCode: "ANYTIME_HR",
        statTarget: 1,
        comparator: ">=",
      }],
      status: "PENDING",
      mode: "PRACTICE",
      createdAt: new Date().toISOString(),
      totalOdds: "+300",
      oddsValue: 300,
      riskTier: "LOW",
      lockNotified: false,
    }];

    const { parlays: repaired, changed } = repairAllSavedParlays(parlays, [{
      homeTeam: "New York Yankees",
      awayTeam: "Boston Red Sox",
      status: "Scheduled",
      id: "777001",
    }]);

    expect(changed).toBe(true);
    expect(repaired[0].legs[0].gamePk).toBe("777001");
    const publicSlip = normalizePublicSlip(repaired[0]);
    expect(assessClientParlayIdentity(publicSlip.legs as unknown as Record<string, unknown>[]).complete).toBe(true);
  });
});
