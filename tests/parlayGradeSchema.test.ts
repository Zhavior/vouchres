import { describe, expect, it } from "vitest";
import { GradeParlaySchema } from "../server/validators/parlaySchemas";

describe("GradeParlaySchema", () => {
  it("normalizes grade legs and stake units", () => {
    const parsed = GradeParlaySchema.parse({
      stakeUnits: "2.5",
      legs: [
        {
          sport: "MLB",
          gamePk: 823062,
          marketCode: "ANYTIME_HR",
          selection: "Aaron Judge 1+ HR",
          odds: -110,
        },
      ],
    });

    expect(parsed.stakeUnits).toBe(2.5);
    expect(parsed.legs[0]).toMatchObject({
      sport: "mlb",
      gamePk: "823062",
      market: "hr",
    });
    expect(parsed.legs[0].oddsDecimal).toBeGreaterThan(1);
  });

  it("rejects empty, oversized, or unsupported grade requests", () => {
    expect(GradeParlaySchema.safeParse({ legs: [] }).success).toBe(false);
    expect(
      GradeParlaySchema.safeParse({
        legs: Array.from({ length: 13 }, () => ({
          sport: "mlb",
          gamePk: "1",
          market: "hr",
          selection: "Player HR",
        })),
      }).success
    ).toBe(false);
    expect(
      GradeParlaySchema.safeParse({
        legs: [{ sport: "soccer", gamePk: "1", market: "goal", selection: "Player goal" }],
      }).success
    ).toBe(false);
  });
});
