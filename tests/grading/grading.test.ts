import { describe, it, expect } from "vitest";
import { getGrader, settleParlay } from "../../server/services/grading/sportGraders";

/** Build a minimal MLB boxscore with one batter in the home lineup. */
function mockBoxscore(playerName: string, stats: { homeRuns?: number; rbi?: number; runs?: number; hits?: number }) {
  return {
    teams: {
      home: {
        players: {
          ID1: {
            person: { fullName: playerName },
            stats: {
              batting: {
                homeRuns: stats.homeRuns ?? 0,
                rbi: stats.rbi ?? 0,
                runs: stats.runs ?? 0,
                hits: stats.hits ?? 0,
              },
            },
          },
        },
      },
      away: { players: {} },
    },
  };
}

const grader = getGrader("mlb");

describe("MLB grader — evaluateLeg", () => {
  it("HR: grades WON when player hit 1+ HR", () => {
    const game = { final: true, raw: mockBoxscore("Aaron Judge", { homeRuns: 1 }) };
    const result = grader.evaluateLeg({ sport: "mlb", gamePk: "1", market: "hr", selection: "Aaron Judge 1+ HR" }, game);
    expect(result.status).toBe("won");
    expect(result.actual).toBe(1);
  });

  it("HR: grades LOST when player hit 0 HR", () => {
    const game = { final: true, raw: mockBoxscore("Aaron Judge", { homeRuns: 0 }) };
    const result = grader.evaluateLeg({ sport: "mlb", gamePk: "1", market: "hr", selection: "Aaron Judge 1+ HR" }, game);
    expect(result.status).toBe("lost");
    expect(result.actual).toBe(0);
  });

  it("HR: grades PUSH (DNP) when player not in boxscore", () => {
    const game = { final: true, raw: mockBoxscore("Someone Else", { homeRuns: 2 }) };
    const result = grader.evaluateLeg({ sport: "mlb", gamePk: "1", market: "hr", selection: "Aaron Judge 1+ HR" }, game);
    expect(result.status).toBe("push");
  });

  it("RBI: grades WON when player has 1+ RBI", () => {
    const game = { final: true, raw: mockBoxscore("Shohei Ohtani", { rbi: 2 }) };
    const result = grader.evaluateLeg({ sport: "mlb", gamePk: "1", market: "rbi", selection: "Shohei Ohtani 1+ RBI" }, game);
    expect(result.status).toBe("won");
  });
});

describe("settleParlay", () => {
  it("all legs WON → parlay WON", () => {
    const legs = [
      { outcome: { status: "won" as const }, oddsDecimal: 2.0 },
      { outcome: { status: "won" as const }, oddsDecimal: 1.8 },
    ];
    const result = settleParlay(legs, 1.0);
    expect(result.status).toBe("won");
    expect(result.settledUnits).toBeGreaterThan(0);
  });

  it("one leg LOST → parlay LOST", () => {
    const legs = [
      { outcome: { status: "won" as const }, oddsDecimal: 2.0 },
      { outcome: { status: "lost" as const }, oddsDecimal: 1.8 },
    ];
    const result = settleParlay(legs, 1.0);
    expect(result.status).toBe("lost");
    expect(result.settledUnits).toBe(-1.0);
  });

  it("any leg PENDING → parlay PENDING", () => {
    const legs = [
      { outcome: { status: "won" as const }, oddsDecimal: 2.0 },
      { outcome: { status: "pending" as const }, oddsDecimal: 1.8 },
    ];
    const result = settleParlay(legs, 1.0);
    expect(result.status).toBe("pending");
  });

  it("all legs PUSH → parlay PUSH (stake refunded)", () => {
    const legs = [
      { outcome: { status: "push" as const }, oddsDecimal: 2.0 },
      { outcome: { status: "push" as const }, oddsDecimal: 1.8 },
    ];
    const result = settleParlay(legs, 1.0);
    expect(result.status).toBe("push");
    expect(result.settledUnits).toBe(0);
  });

  it("DNP leg (push) + 2 WON → parlay WON at reduced odds", () => {
    const legs = [
      { outcome: { status: "won" as const }, oddsDecimal: 2.0 },
      { outcome: { status: "won" as const }, oddsDecimal: 2.0 },
      { outcome: { status: "push" as const }, oddsDecimal: 1.5 }, // DNP
    ];
    const result = settleParlay(legs, 1.0);
    expect(result.status).toBe("won");
    // 2 won legs at 2.0 each: payout = 1.0 * (2*2 - 1) = 3.0
    expect(result.settledUnits).toBe(3.0);
  });
});
