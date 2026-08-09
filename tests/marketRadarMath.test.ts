import { describe, expect, it } from "vitest";
import {
  calculateHrSusceptibility,
  calculatePitcherKDelta,
  calculateSbTimingMismatch,
  isHighHrSusceptibility,
  isHighSbEdge,
  normalizeOddsPrice,
  projectPitcherStrikeouts,
  pitcherKStatus,
  sortMarketEdges,
} from "../server/services/marketRadar/math";

describe("market radar math", () => {
  it("normalizes American and decimal prices", () => {
    expect(normalizeOddsPrice(150, "american")).toEqual({
      american: 150,
      decimal: 2.5,
      impliedProbability: 0.4,
    });
    expect(normalizeOddsPrice(-110, "american")).toEqual({
      american: -110,
      decimal: 1.9091,
      impliedProbability: 0.52381,
    });
    expect(normalizeOddsPrice(1.8, "decimal")).toEqual({
      american: -125,
      decimal: 1.8,
      impliedProbability: 0.555556,
    });
  });

  it("rejects invalid prices instead of inventing probabilities", () => {
    expect(() => normalizeOddsPrice(0, "american")).toThrow(RangeError);
    expect(() => normalizeOddsPrice(1, "decimal")).toThrow(RangeError);
  });

  it("projects pitcher strikeouts and returns the line delta", () => {
    const projection = projectPitcherStrikeouts({
      pitcherCswPercent: 0.324,
      opponentWhiffPercent: 0.281,
      projectedBattersFaced: 24,
    });
    expect(projection).toBe(13.41);
    expect(calculatePitcherKDelta(projection, 12.5)).toBe(0.91);
    expect(pitcherKStatus(1.2)).toBe("TARGET OVER");
    expect(pitcherKStatus(-1.2)).toBe("TARGET UNDER");
    expect(pitcherKStatus(1.19)).toBe("NO EDGE / MONITOR");
  });

  it("scores HR susceptibility from bounded physical inputs", () => {
    expect(calculateHrSusceptibility({
      pitcherFlyBallPercent: 70,
      pitcherBarrelAllowedPercent: 25,
      parkFactorHr: 140,
    })).toBe(66);
    expect(isHighHrSusceptibility(66, 9.5)).toBe(true);
  });

  it("calculates positive SB timing mismatch when the runner beats the defensive clock", () => {
    expect(calculateSbTimingMismatch({
      runnerSprintSpeedFtSec: 26.98,
      catcherPopTime: 2.08,
    })).toBe(0.18);
    expect(isHighSbEdge(0.18)).toBe(true);
  });

  it("sorts dynamically without mutating the input", () => {
    const input = [
      { id: "a", edgeScore: 3, confidence: 90 },
      { id: "b", edgeScore: 8, confidence: 50 },
      { id: "c", edgeScore: 8, confidence: 75 },
    ];
    expect(sortMarketEdges(input).map((edge) => edge.id)).toEqual(["c", "b", "a"]);
    expect(input.map((edge) => edge.id)).toEqual(["a", "b", "c"]);
  });
});
