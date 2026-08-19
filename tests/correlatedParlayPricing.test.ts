import { describe, expect, it } from "vitest";
import {
  priceCorrelatedParlay,
  toDecimalOdds,
  decimalToAmerican,
  inverseNormalCdf,
  choleskyWithShrinkage,
  type PricedLeg,
} from "../src/lib/parlays/correlatedParlayPricing";
import {
  pairCorrelation,
  buildCorrelationMatrix,
  CORRELATION_PRIORS,
} from "../src/lib/parlays/legCorrelation";

function leg(over: Partial<PricedLeg> & { id: string }): PricedLeg {
  return {
    gamePk: 1,
    playerId: null,
    teamId: 100,
    marketCode: "home_run",
    role: "batter",
    odds: "+300",
    ...over,
  };
}

describe("odds conversion", () => {
  it("round-trips American and decimal odds", () => {
    expect(toDecimalOdds("+300")).toBeCloseTo(4);
    expect(toDecimalOdds(300)).toBeCloseTo(4);
    expect(toDecimalOdds("-110")).toBeCloseTo(1.909, 3);
    expect(toDecimalOdds(2.5)).toBeCloseTo(2.5);
    expect(decimalToAmerican(4)).toBe("+300");
    expect(decimalToAmerican(1.909)).toBe("-110");
  });

  it("rejects unusable prices instead of guessing", () => {
    expect(toDecimalOdds(null)).toBeNull();
    expect(toDecimalOdds("")).toBeNull();
    expect(toDecimalOdds(0)).toBeNull();
    expect(toDecimalOdds(-50)).toBeNull();
    expect(toDecimalOdds("TBD")).toBeNull();
  });
});

describe("inverse normal cdf", () => {
  it("matches known quantiles", () => {
    expect(inverseNormalCdf(0.5)).toBeCloseTo(0, 6);
    expect(inverseNormalCdf(0.975)).toBeCloseTo(1.959964, 4);
    expect(inverseNormalCdf(0.025)).toBeCloseTo(-1.959964, 4);
    expect(inverseNormalCdf(0.001)).toBeCloseTo(-3.090232, 3);
  });
});

describe("correlation matrix", () => {
  it("treats different games as independent", () => {
    expect(pairCorrelation(
      leg({ id: "a", gamePk: 1 }),
      leg({ id: "b", gamePk: 2 }),
    )).toBe(0);
  });

  it("couples two offensive markets on the same batter most strongly", () => {
    const rho = pairCorrelation(
      leg({ id: "a", playerId: 1, marketCode: "home_run" }),
      leg({ id: "b", playerId: 1, marketCode: "total_bases" }),
    );
    expect(rho).toBe(CORRELATION_PRIORS.sameBatterOffense);
    expect(rho).toBeGreaterThan(CORRELATION_PRIORS.sameTeamOffense);
  });

  it("opposes a batter and the pitcher he faces", () => {
    const rho = pairCorrelation(
      leg({ id: "a", playerId: 1, teamId: 100, marketCode: "home_run", role: "batter" }),
      leg({ id: "b", playerId: 2, teamId: 200, marketCode: "pitcher_strikeouts", role: "pitcher" }),
    );
    expect(rho).toBeLessThan(0);
  });

  it("builds a symmetric matrix with a unit diagonal", () => {
    const legs = [leg({ id: "a" }), leg({ id: "b", playerId: 9 }), leg({ id: "c", gamePk: 7 })];
    const m = buildCorrelationMatrix(legs);
    for (let i = 0; i < 3; i += 1) {
      expect(m[i][i]).toBe(1);
      for (let j = 0; j < 3; j += 1) expect(m[i][j]).toBe(m[j][i]);
    }
  });
});

describe("cholesky", () => {
  it("shrinks an unrealisable prior matrix instead of failing", () => {
    // 0.95 mutual correlation across three legs is not positive definite.
    const impossible = [
      [1, 0.95, 0.95],
      [0.95, 1, 0.95],
      [0.95, 0.95, 1],
    ];
    const L = choleskyWithShrinkage(impossible);
    expect(L).toHaveLength(3);
    expect(L.every((row) => row.every((v) => Number.isFinite(v)))).toBe(true);
    expect(L[0][0]).toBeGreaterThan(0);
  });
});

describe("priceCorrelatedParlay", () => {
  it("matches naive multiplication when legs are in different games", () => {
    const result = priceCorrelatedParlay([
      leg({ id: "a", gamePk: 1, playerId: 1, teamId: 100 }),
      leg({ id: "b", gamePk: 2, playerId: 2, teamId: 200 }),
      leg({ id: "c", gamePk: 3, playerId: 3, teamId: 300 }),
    ]);

    expect(result).not.toBeNull();
    expect(result!.correlated).toBe(false);
    expect(result!.correlationFactor).toBe(1);
    // 4.0 ^ 3 = 64
    expect(result!.decimal).toBeCloseTo(64, 1);
  });

  it("prices a positively correlated same-game stack SHORTER than naive", () => {
    const result = priceCorrelatedParlay([
      leg({ id: "a", gamePk: 5, playerId: 1, teamId: 100, marketCode: "home_run" }),
      leg({ id: "b", gamePk: 5, playerId: 1, teamId: 100, marketCode: "total_bases" }),
      leg({ id: "c", gamePk: 5, playerId: 2, teamId: 100, marketCode: "rbi" }),
    ]);

    expect(result).not.toBeNull();
    expect(result!.correlated).toBe(true);
    // Correlated legs hit together more often, so the fair price is shorter.
    expect(result!.decimal).toBeLessThan(result!.naiveDecimal);
    expect(result!.correlationFactor).toBeLessThan(1);
  });

  it("prices negatively correlated legs LONGER than naive", () => {
    const result = priceCorrelatedParlay([
      leg({ id: "a", gamePk: 5, playerId: 1, teamId: 100, marketCode: "home_run", role: "batter" }),
      leg({ id: "b", gamePk: 5, playerId: 2, teamId: 200, marketCode: "pitcher_strikeouts", role: "pitcher" }),
    ]);

    expect(result).not.toBeNull();
    expect(result!.decimal).toBeGreaterThan(result!.naiveDecimal);
    expect(result!.correlationFactor).toBeGreaterThan(1);
  });

  it("is deterministic — the same slip always prices identically", () => {
    const legs = [
      leg({ id: "a", gamePk: 5, playerId: 1, marketCode: "home_run" }),
      leg({ id: "b", gamePk: 5, playerId: 1, marketCode: "total_bases" }),
    ];
    const first = priceCorrelatedParlay(legs);
    const second = priceCorrelatedParlay(legs);
    expect(first!.decimal).toBe(second!.decimal);
    expect(first!.probability).toBe(second!.probability);
  });

  it("returns null when any leg has no usable price", () => {
    expect(priceCorrelatedParlay([
      leg({ id: "a" }),
      leg({ id: "b", odds: null }),
    ])).toBeNull();
    expect(priceCorrelatedParlay([])).toBeNull();
  });

  it("never reports an infinite price for a very long correlated slip", () => {
    const legs = Array.from({ length: 8 }, (_, i) =>
      leg({ id: `l${i}`, gamePk: 5, playerId: i, teamId: 100, odds: "+900" }));
    const result = priceCorrelatedParlay(legs, { samples: 4000 });
    expect(Number.isFinite(result!.decimal)).toBe(true);
    expect(result!.probability).toBeGreaterThan(0);
  });

  it("takes the exact independent path below the materiality threshold", () => {
    // Opposing offences in one game sit at 0.09 — under the 0.15 threshold, so
    // the slip is priced exactly rather than simulated. This keeps a weak prior
    // from adding Monte Carlo noise to a number the user reads as precise.
    const result = priceCorrelatedParlay([
      leg({ id: "a", gamePk: 5, playerId: 1, teamId: 100, odds: "-110" }),
      leg({ id: "b", gamePk: 5, playerId: 2, teamId: 200, odds: "-110" }),
    ]);
    expect(result!.correlated).toBe(false);
    expect(result!.correlationFactor).toBe(1);
    expect(result!.samples).toBe(0);
  });

  it("stays within Monte Carlo noise of the analytic answer for weak coupling", () => {
    // Same-team offence (0.24) is above threshold, so this is simulated. The
    // correlated price must move off naive but stay in a sane band, not collapse.
    const result = priceCorrelatedParlay([
      leg({ id: "a", gamePk: 5, playerId: 1, teamId: 100, marketCode: "hits", odds: "-110" }),
      leg({ id: "b", gamePk: 5, playerId: 2, teamId: 100, marketCode: "rbi", odds: "-110" }),
    ], { samples: 60000 });
    expect(result!.correlated).toBe(true);
    expect(result!.correlationFactor).toBeGreaterThan(0.7);
    expect(result!.correlationFactor).toBeLessThan(1);
  });
});
