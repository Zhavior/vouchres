import { describe, expect, it } from "vitest";
import { settleMlbPlayerMarket } from "../server/services/grading/marketSettlementEngine";

function boxscore(player: Record<string, unknown>) {
  return { teams: { away: { players: { ID592450: player } }, home: { players: {} } } };
}

describe("market settlement engine", () => {
  const judge = {
    person: { id: 592450, fullName: "Aaron Judge" },
    stats: { batting: { plateAppearances: 4, atBats: 3, homeRuns: 1, hits: 2, totalBases: 6, doubles: 1, triples: 0 } },
  };

  it("settles a home run from canonical player identity and official stats", () => {
    expect(settleMlbPlayerMarket({ sport: "mlb", marketCode: "ANYTIME_HR", playerId: 592450 }, boxscore(judge))).toMatchObject({
      decision: "won",
      actual: 1,
      target: 1,
      playerName: "Aaron Judge",
    });
  });

  it("settles frozen alternate hit lines and comparators", () => {
    expect(settleMlbPlayerMarket({ sport: "mlb", marketCode: "HITS", playerId: 592450, statTarget: 2, comparator: ">=" }, boxscore(judge)).decision).toBe("won");
    expect(settleMlbPlayerMarket({ sport: "mlb", marketCode: "HITS", playerId: 592450, statTarget: 2.5, comparator: ">" }, boxscore(judge)).decision).toBe("lost");
  });

  it("voids a confirmed player who did not participate", () => {
    const dnp = { person: { id: 592450, fullName: "Aaron Judge" }, stats: { batting: { plateAppearances: 0, atBats: 0, homeRuns: 0 } } };
    expect(settleMlbPlayerMarket({ sport: "mlb", marketCode: "HR", playerId: 592450 }, boxscore(dnp)).decision).toBe("void");
  });

  it("routes missing identity, unknown markets, and absent players to review", () => {
    expect(settleMlbPlayerMarket({ sport: "mlb", marketCode: "HR" }, boxscore(judge)).decision).toBe("review");
    expect(settleMlbPlayerMarket({ sport: "mlb", marketCode: "FANTASY_POINTS", playerId: 592450 }, boxscore(judge)).decision).toBe("review");
    expect(settleMlbPlayerMarket({ sport: "mlb", marketCode: "HR", playerId: 1 }, boxscore(judge)).decision).toBe("review");
  });

  it("grades pitcher strikeouts from pitching participation, not batting fields", () => {
    const pitcher = {
      person: { id: 592450, fullName: "Starter One" },
      stats: { pitching: { inningsPitched: "6.0", strikeOuts: 7 } },
    };
    expect(settleMlbPlayerMarket({ sport: "mlb", marketCode: "PITCHER_STRIKEOUTS", playerId: 592450, statTarget: 6.5, comparator: ">" }, boxscore(pitcher))).toMatchObject({ decision: "won", actual: 7 });
  });
});
