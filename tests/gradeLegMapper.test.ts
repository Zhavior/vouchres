import { describe, expect, it } from "vitest";
import { buildGradeLegPayload, mapMarketCodeToGraderMarket } from "../src/lib/parlays/gradeLegMapper";

describe("gradeLegMapper", () => {
  it("maps ANYTIME_HR to hr grader market", () => {
    expect(mapMarketCodeToGraderMarket("ANYTIME_HR", 1)).toBe("hr");
    expect(mapMarketCodeToGraderMarket("ANYTIME_HR", 2)).toBe("hr_multi");
  });

  it("converts american odds to decimal for grade payload", () => {
    const payload = buildGradeLegPayload({
      sport: "MLB",
      gamePk: "777001",
      marketCode: "ANYTIME_HR",
      selection: "Aaron Judge Anytime HR",
      odds: -110,
      statTarget: 1,
    });
    expect(payload).toMatchObject({
      sport: "mlb",
      gamePk: "777001",
      market: "hr",
      selection: "Aaron Judge Anytime HR",
    });
    expect(payload?.oddsDecimal).toBeGreaterThan(1);
    expect(payload?.oddsDecimal).toBeLessThan(2);
  });

  it("converts oddsDecimal when american -110 is passed in the wrong field", () => {
    const payload = buildGradeLegPayload({
      sport: "mlb",
      gamePk: "777001",
      marketCode: "ANYTIME_HR",
      selection: "Player HR",
      oddsDecimal: -110,
    });
    expect(payload?.oddsDecimal).toBeGreaterThan(1);
    expect(payload?.oddsDecimal).toBeLessThan(2);
  });

  it("builds selection from player name when missing", () => {
    const payload = buildGradeLegPayload({
      sport: "mlb",
      gamePk: "777001",
      marketCode: "RUN",
      playerName: "Aaron Judge",
      marketLabel: "To Score 1+ Run",
    });
    expect(payload?.selection).toContain("Aaron Judge");
    expect(payload?.market).toBe("run");
  });
});
