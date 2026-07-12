import { describe, expect, it } from "vitest";
import { decideModelPromotion, evaluateBinaryPredictions } from "../server/services/intelligence/centralBrain/modelEvaluation";

describe("ProjectVABrAIns model evaluation", () => {
  it("calculates proper probability metrics and calibration buckets", () => {
    const result = evaluateBinaryPredictions([
      { probability: 0.8, outcome: 1 },
      { probability: 0.7, outcome: 1 },
      { probability: 0.2, outcome: 0 },
      { probability: 0.1, outcome: 0 },
    ]);
    expect(result).toMatchObject({ samples: 4, positives: 2 });
    expect(result.brierScore).toBeCloseTo(0.045, 5);
    expect(result.logLoss).toBeLessThan(0.3);
    expect(result.buckets.length).toBeGreaterThan(0);
  });

  it("rejects promotion when evidence is too small", () => {
    const challenger = Array.from({ length: 20 }, (_, index) => ({ probability: index < 10 ? 0.8 : 0.2, outcome: (index < 10 ? 1 : 0) as 0 | 1 }));
    const incumbent = challenger.map((item) => ({ ...item, probability: 0.5 }));
    const decision = decideModelPromotion({ challenger, incumbent });
    expect(decision.promote).toBe(false);
    expect(decision.reasons).toContain("Needs at least 250 out-of-sample observations.");
  });

  it("promotes only a challenger that beats the incumbent on the same observations", () => {
    const outcomes = Array.from({ length: 300 }, (_, index) => (index % 5 === 0 ? 1 : 0) as 0 | 1);
    const challenger = outcomes.map((outcome) => ({ probability: outcome ? 0.55 : 0.12, outcome }));
    const incumbent = outcomes.map((outcome) => ({ probability: 0.2, outcome }));
    const decision = decideModelPromotion({ challenger, incumbent, maximumCalibrationRegression: 1 });
    expect(decision.promote).toBe(true);
    expect(decision.challenger.brierScore).toBeLessThan(decision.incumbent.brierScore);
  });

  it("rejects comparisons made on different samples", () => {
    expect(() => decideModelPromotion({
      challenger: [{ probability: 0.5, outcome: 1 }],
      incumbent: [],
    })).toThrow("same observations");
  });
});
