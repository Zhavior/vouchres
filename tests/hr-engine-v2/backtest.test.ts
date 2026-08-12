import { describe, expect, it } from "vitest";
import {
  assertNoFutureLeakage,
  buildPregameFeatures,
  calculateMetrics,
  splitForDate,
  type HistoricalStatcastRow,
} from "../../server/services/mlb/hr-engine/v2/backtest";

function row(date: string, pa: string, outcome: 0 | 1): HistoricalStatcastRow {
  return {
    gameId: `g-${date}`,
    gameDate: date,
    firstPitchAt: `${date}T18:00:00.000Z`,
    batterId: 1,
    pitcherId: 2,
    batterTeam: "NYY",
    opponentTeam: "BOS",
    parkId: "TEST",
    batterHand: "R",
    pitcherHand: "R",
    pitchType: "FF",
    plateAppearanceId: pa,
    homeRunOutcome: outcome,
    exitVelocity: 100,
    launchAngle: 25,
    barrelFlag: 1,
    hardHitFlag: 1,
    sprayDirection: 10,
    lineupSlot: 2,
    startingLineupConfirmed: true,
    source: "Baseball Savant Statcast Search",
    sourceRetrievedAt: "2026-08-11T00:00:00.000Z",
    featureCutoffAt: `${date}T00:00:00.000Z`,
  };
}

describe("HR V2 historical backtest", () => {
  it("uses strictly chronological train, calibration, and test boundaries", () => {
    expect(splitForDate("2024-09-30", { trainEnd: "2024-10-01", calibrationEnd: "2025-07-01" })).toBe("train");
    expect(splitForDate("2025-06-30", { trainEnd: "2024-10-01", calibrationEnd: "2025-07-01" })).toBe("calibration");
    expect(splitForDate("2025-07-02", { trainEnd: "2024-10-01", calibrationEnd: "2025-07-01" })).toBe("test");
  });

  it("builds pregame features from prior plate appearances only", () => {
    const features = buildPregameFeatures([
      row("2024-09-30", "pa-1", 1),
      row("2024-10-01", "pa-2", 0),
    ], { trainEnd: "2024-10-01", calibrationEnd: "2025-07-01" });
    expect(features[0].priorBatterPa).toBe(0);
    expect(features[1].priorBatterPa).toBe(1);
    expect(features[1].priorBatterHr).toBe(1);
    expect(() => assertNoFutureLeakage(features)).not.toThrow();
  });

  it("reports bounded metrics and a baseline comparison", () => {
    const rows = [row("2025-07-02", "pa-1", 1), row("2025-07-03", "pa-2", 0)];
    const metrics = calculateMetrics(buildPregameFeatures(rows, { trainEnd: "2024-10-01", calibrationEnd: "2025-07-01" }), [0.8, 0.2], 0.04);
    expect(metrics.sampleCount).toBe(2);
    expect(metrics.brierScore).toBeLessThan(0.1);
    expect(metrics.baselineBrierScore).toBeGreaterThan(metrics.brierScore!);
  });
});
