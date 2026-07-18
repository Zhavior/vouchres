import { describe, expect, it } from "vitest";
import {
  officialStarterSpot,
  officialStartersFromBoxscoreTeam,
} from "../server/services/mlb/hrPipeline";

describe("official starter lineup from boxscore", () => {
  it("maps 1-9 and 100/200/.../900 to starter spots", () => {
    expect(officialStarterSpot(3)).toBe(3);
    expect(officialStarterSpot(300)).toBe(3);
    expect(officialStarterSpot("500")).toBe(5);
  });

  it("rejects mid-game subs and missing orders", () => {
    expect(officialStarterSpot(101)).toBeNull();
    expect(officialStarterSpot(201)).toBeNull();
    expect(officialStarterSpot(null)).toBeNull();
    expect(officialStarterSpot(undefined)).toBeNull();
  });

  it("never treats batters[] index alone as confirmed order", () => {
    const team = {
      batters: [11, 22, 33],
      players: {
        // Only player 11 has an official starter order; 22/33 are PH/extras without starter codes.
        ID11: { battingOrder: 100 },
        ID22: { battingOrder: 101 },
        ID33: {},
      },
    };
    const starters = officialStartersFromBoxscoreTeam(team);
    expect([...starters.entries()]).toEqual([[11, 1]]);
  });
});
