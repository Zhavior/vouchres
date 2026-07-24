/**
 * Regression tests for two grading-correctness bugs that fabricated LOSSES
 * on the public ledger (the product's core "honest grading" promise):
 *
 *  1. Postponed/suspended/cancelled games were treated as "final" (MLB reports
 *     abstractGameState="Final" alongside detailedState="Postponed"), hit an
 *     empty box score, and graded every player prop as a loss.
 *  2. A player absent from the box score (DNP/scratch/trade/name-mismatch) was
 *     counted as 0 and graded as a real LOSS, instead of a push/void.
 */
import { describe, it, expect } from "vitest";
import { isMlbFinalStatusText, isMlbAbandonedStatus } from "../server/services/mlb/gameStatus";
import { countPlayerStat, evaluatePick } from "../server/services/grading/gradingService";

describe("isMlbFinalStatusText — abandoned games are NOT final", () => {
  it("treats a completed game as final", () => {
    expect(isMlbFinalStatusText({ abstractGameState: "Final", detailedState: "Final", codedGameState: "F" })).toBe(true);
    expect(isMlbFinalStatusText({ abstractGameState: "Final", detailedState: "Game Over" })).toBe(true);
    expect(isMlbFinalStatusText({ detailedState: "Completed Early" })).toBe(true); // rain-shortened but official
  });

  it("does NOT treat a postponed game as final (even when abstractGameState=Final)", () => {
    expect(isMlbFinalStatusText({ abstractGameState: "Final", detailedState: "Postponed", codedGameState: "D" })).toBe(false);
    expect(isMlbAbandonedStatus({ detailedState: "Postponed" })).toBe(true);
  });

  it("does NOT treat suspended / cancelled / forfeited games as final", () => {
    expect(isMlbFinalStatusText({ abstractGameState: "Final", detailedState: "Suspended" })).toBe(false);
    expect(isMlbFinalStatusText({ abstractGameState: "Final", detailedState: "Cancelled" })).toBe(false);
    expect(isMlbFinalStatusText({ detailedState: "Forfeit" })).toBe(false);
  });

  it("still grades a suspended game once it resumes and completes (detailedState=Final)", () => {
    // After resumption MLB reports detailedState="Final", not "Suspended".
    expect(isMlbFinalStatusText({ abstractGameState: "Final", detailedState: "Final" })).toBe(true);
  });
});

describe("countPlayerStat — absent player is null, not 0", () => {
  const boxWithJudge = {
    teams: {
      away: { players: { ID592450: { person: { fullName: "Aaron Judge" }, stats: { batting: { homeRuns: 0, rbi: 2 } } } } },
      home: { players: {} },
    },
  };

  it("returns the real stat when the player played", () => {
    expect(countPlayerStat(boxWithJudge, "Aaron Judge", "rbi")).toBe(2);
  });

  it("returns 0 (a real 0) when the player played but the stat is 0/absent", () => {
    expect(countPlayerStat(boxWithJudge, "Aaron Judge", "homeRuns")).toBe(0);
  });

  it("returns NULL when the player is not in the box score at all (DNP/scratch)", () => {
    expect(countPlayerStat(boxWithJudge, "Shohei Ohtani", "homeRuns")).toBeNull();
    expect(countPlayerStat({ teams: {} }, "Aaron Judge", "homeRuns")).toBeNull();
  });
});

describe("evaluatePick — a scratched player is PUSHED, never graded as a loss", () => {
  const basePick = { odds_decimal: 2.5, stake_units: 1, leg_type: "single", sport: "mlb" as const };

  const boxNoOhtani = {
    teams: {
      away: { players: { ID592450: { person: { fullName: "Aaron Judge" }, stats: { batting: { homeRuns: 1 } } } } },
      home: { players: {} },
    },
  };

  it("pushes (refunds) an HR pick when the player didn't appear", async () => {
    const result = await evaluatePick(
      { ...basePick, id: "p1", market: "hr", selection: "Shohei Ohtani 1+ HR" },
      boxNoOhtani,
    );
    expect(result.status).toBe("push");
    expect(result.settled_units).toBe(0);
  });

  it("still grades a real WIN for a player who actually homered", async () => {
    const result = await evaluatePick(
      { ...basePick, id: "p2", market: "hr", selection: "Aaron Judge 1+ HR" },
      boxNoOhtani,
    );
    expect(result.status).toBe("won");
  });

  it("still grades a real LOSS for a player who played but did not homer", async () => {
    const boxJudge0 = {
      teams: {
        away: { players: { ID592450: { person: { fullName: "Aaron Judge" }, stats: { batting: { homeRuns: 0 } } } } },
        home: { players: {} },
      },
    };
    const result = await evaluatePick(
      { ...basePick, id: "p3", market: "hr", selection: "Aaron Judge 1+ HR" },
      boxJudge0,
    );
    expect(result.status).toBe("lost");
  });

  it("rejects client avoid markets instead of inverting settle logic", async () => {
    const result = await evaluatePick(
      { ...basePick, id: "p4", market: "hr_avoid", selection: "Aaron Judge 1+ HR" },
      boxNoOhtani,
    );
    expect(result.status).toBe("graded_error");
    expect(result.error).toBe("client_avoid_market_rejected");
  });

  it("only inverts HR settle when judge_verdict is avoid", async () => {
    const result = await evaluatePick(
      {
        ...basePick,
        id: "p5",
        market: "hr",
        selection: "Aaron Judge 1+ HR",
        judge_verdict: "avoid",
      },
      boxNoOhtani,
    );
    expect(result.status).toBe("lost");
  });
});
