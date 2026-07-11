import { describe, expect, it } from "vitest";
import { assessClientParlayIdentity, isClientLegIdentityComplete } from "../src/lib/parlayIdentity";

describe("parlayIdentity (client)", () => {
  it("marks complete legs with game, market, player, target, comparator", () => {
    expect(isClientLegIdentityComplete({
      gamePk: "777001",
      marketCode: "ANYTIME_HR",
      playerId: "660271",
      threshold: 1,
      comparator: ">=",
    }, 0)).toBe(true);
  });

  it("flags incomplete legs missing player id", () => {
    const result = assessClientParlayIdentity([
      { gamePk: "777001", marketCode: "ANYTIME_HR", threshold: 1, comparator: ">=" },
    ]);
    expect(result.complete).toBe(false);
    expect(result.missingLegIndexes).toEqual([0]);
  });
});
