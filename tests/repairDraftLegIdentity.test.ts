import { describe, expect, it } from "vitest";
import { assessClientParlayIdentity, isClientLegIdentityComplete } from "../src/lib/parlayIdentity";
import { repairDraftLegIdentity, repairDraftLegsIdentity } from "../src/lib/parlays/repairDraftLegIdentity";
import type { DraftParlayLeg } from "../src/stores/parlayCommandStore";

const slate = [{
  homeTeam: "New York Yankees",
  awayTeam: "Boston Red Sox",
  status: "Scheduled",
  id: "777001",
  homeTeamId: 147,
  awayTeamId: 111,
}];

describe("repairDraftLegIdentity", () => {
  it("fills gamePk from team abbrev when slate uses full names", () => {
    const leg: DraftParlayLeg = {
      id: "leg-1",
      source: "manual",
      sport: "MLB",
      selection: "Aaron Judge Anytime HR",
      teamLabel: "NYY",
      playerId: "592450",
      marketLabel: "To Hit a Home Run (Anytime)",
      statTarget: 1,
      comparator: ">=",
    };

    const { leg: repaired, changed } = repairDraftLegIdentity(leg, slate);
    expect(changed).toBe(true);
    expect(repaired.gamePk).toBe("777001");
    expect(repaired.gameId).toBe("777001");
    expect(repaired.marketCode).toBe("ANYTIME_HR");
    expect(isClientLegIdentityComplete(repaired as unknown as Record<string, unknown>, 0)).toBe(true);
  });

  it("infers marketCode and statTarget from selection text", () => {
    const leg: DraftParlayLeg = {
      id: "leg-2",
      source: "manual",
      sport: "MLB",
      selection: "Aaron Judge 2+ Total Bases",
      teamLabel: "NYY",
      playerId: "592450",
      gamePk: "777001",
    };

    const { leg: repaired } = repairDraftLegIdentity(leg, slate);
    expect(repaired.marketCode).toBe("TOTAL_BASES");
    expect(Number(repaired.statTarget)).toBe(2);
    expect(repaired.comparator).toBe(">=");
  });

  it("marks batch repair complete when all legs become gradable", () => {
    const legs: DraftParlayLeg[] = [{
      id: "leg-3",
      source: "manual",
      sport: "MLB",
      selection: "Aaron Judge Anytime HR",
      teamLabel: "NYY",
      playerId: "592450",
      marketLabel: "Anytime HR",
    }];

    const result = repairDraftLegsIdentity(legs, slate);
    expect(result.changed).toBe(true);
    expect(result.complete).toBe(true);
    expect(assessClientParlayIdentity(result.legs as unknown as Record<string, unknown>[]).complete).toBe(true);
  });
});
