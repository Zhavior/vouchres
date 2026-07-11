import { describe, expect, it } from "vitest";
import {
  buildGradeLegPayload,
  isFakeGeneratedGamePk,
  mapMarketCodeToGraderMarket,
  resolveGradeGamePk,
} from "../src/lib/parlays/gradeLegMapper";
import { GradeParlaySchema } from "../server/validators/parlaySchemas";

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

  it("falls back from empty gamePk to gameId", () => {
    expect(resolveGradeGamePk({ gamePk: "", gameId: "777001" })).toBe("777001");
    const payload = buildGradeLegPayload({
      sport: "mlb",
      gamePk: "",
      gameId: "777001",
      marketCode: "ANYTIME_HR",
      selection: "Judge HR",
    });
    expect(payload?.gamePk).toBe("777001");
    expect(GradeParlaySchema.safeParse({ legs: [payload], stakeUnits: 1 }).success).toBe(true);
  });

  it("uses numeric game field when gamePk is missing", () => {
    const payload = buildGradeLegPayload({
      sport: "mlb",
      game: "777001",
      marketCode: "HIT",
      selection: "Player Hit",
    });
    expect(payload?.gamePk).toBe("777001");
  });

  it("rejects fake generated game ids", () => {
    expect(isFakeGeneratedGamePk("leg-123")).toBe(true);
    expect(buildGradeLegPayload({
      sport: "mlb",
      gamePk: "leg-123",
      marketCode: "HIT",
      selection: "Player Hit",
    })).toBeNull();
  });

  it("truncates oversized selections for schema compatibility", () => {
    const payload = buildGradeLegPayload({
      sport: "mlb",
      gamePk: "777001",
      marketCode: "ANYTIME_HR",
      selection: "x".repeat(300),
    });
    expect(payload?.selection).toHaveLength(280);
    expect(GradeParlaySchema.safeParse({ legs: [payload], stakeUnits: 1 }).success).toBe(true);
  });

  it("drops oddsDecimal values above schema max", () => {
    const payload = buildGradeLegPayload({
      sport: "mlb",
      gamePk: "777001",
      marketCode: "ANYTIME_HR",
      selection: "Longshot HR",
      odds: 1_000_000,
    });
    expect(payload?.oddsDecimal).toBeUndefined();
    expect(GradeParlaySchema.safeParse({ legs: [payload], stakeUnits: 1 }).success).toBe(true);
  });

  it("parses gamePk from canonical eventKey when gamePk is missing", () => {
    const payload = buildGradeLegPayload({
      sport: "MLB",
      eventKey: "MLB_777001_147_592450_ANYTIME_HR_1_GTE",
      marketCode: "ANYTIME_HR",
      selection: "Aaron Judge 1+ HR",
      odds: -110,
    });
    expect(payload?.gamePk).toBe("777001");
    expect(GradeParlaySchema.safeParse({ legs: [payload], stakeUnits: 1 }).success).toBe(true);
  });

  it("skips fake gamePk and uses eventKey game id", () => {
    const payload = buildGradeLegPayload({
      sport: "mlb",
      gamePk: "leg-123",
      eventKey: "MLB_777001_147_592450_HIT_1_GTE",
      marketCode: "HIT",
      selection: "Player Hit",
    });
    expect(payload?.gamePk).toBe("777001");
  });
});
