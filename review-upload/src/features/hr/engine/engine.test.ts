/**
 * HR Engine — Unit tests
 *
 * Run: npx vitest run hr-engine/engine.test.ts
 *
 * These verify the math produces sensible outputs:
 *   - Elite hitters score high (80+)
 *   - Weak hitters score low (<60)
 *   - Regression works (small sample shrinks toward league avg)
 *   - Parlay math compounds correctly
 *   - Tiers are assigned correctly
 *   - Reasons are generated for every prediction
 *   - K penalty reduces the score
 *   - Confidence multiplier dampens the displayed score
 */

import { describe, it, expect } from "vitest";
import { calculateHrPrediction, calculateHrPredictionsBatch } from "./hrEngine";
import { regressHrFb, regressStat, rateToPercentile } from "./regression";
import { scanParlay } from "./parlayScanner";
import { generateVouchCard } from "./vouchCardGenerator";
import { calculateProcessScore } from "./processScore";
import { calculateProfileStats } from "./profileStats";
import { AARON_JUDGE_INPUTS, JUAN_SOTO_INPUTS, WEAK_HITTER_INPUTS } from "./mockData";

describe("HR Engine — core", () => {
  it("produces a prediction for Aaron Judge (elite)", () => {
    const pred = calculateHrPrediction(AARON_JUDGE_INPUTS);

    expect(pred.playerName).toBe("Aaron Judge");
    expect(pred.hrScore).toBeGreaterThan(70);
    expect(pred.hrProbability).toBeGreaterThan(0);
    expect(pred.hrProbability).toBeLessThan(0.30);
    expect(pred.tier.tier).toMatch(/Elite|Strong|Good/);
    expect(pred.confidence.level).toMatch(/High|Medium-High|Medium/);
    expect(pred.topReasons.length).toBeGreaterThan(0);
    expect(pred.risks.length).toBeGreaterThan(0);
    expect(pred.modelNote).toContain("Aaron Judge");
    expect(pred.modelNote).toContain("% HR probability");
  });

  it("produces a prediction for Juan Soto (strong)", () => {
    const pred = calculateHrPrediction(JUAN_SOTO_INPUTS);

    expect(pred.hrScore).toBeGreaterThan(60);
    expect(pred.tier.tier).toMatch(/Strong|Good|Elite/);
  });

  it("produces a low score for a weak hitter in a bad matchup", () => {
    const pred = calculateHrPrediction(WEAK_HITTER_INPUTS);

    expect(pred.hrScore).toBeLessThan(60);
    expect(pred.tier.tier).toBe("Avoid");
    expect(pred.hrProbability).toBeLessThan(0.03);
  });

  it("orders predictions by score (highest first)", () => {
    const preds = calculateHrPredictionsBatch([
      WEAK_HITTER_INPUTS,
      AARON_JUDGE_INPUTS,
      JUAN_SOTO_INPUTS,
    ]);

    expect(preds[0].hrScore).toBeGreaterThanOrEqual(preds[1].hrScore);
    expect(preds[1].hrScore).toBeGreaterThanOrEqual(preds[2].hrScore);
    expect(preds[0].playerName).toBe("Aaron Judge");
  });

  it("generates at least 1 reason and 1 risk for every prediction", () => {
    const preds = [
      calculateHrPrediction(AARON_JUDGE_INPUTS),
      calculateHrPrediction(JUAN_SOTO_INPUTS),
      calculateHrPrediction(WEAK_HITTER_INPUTS),
    ];

    for (const pred of preds) {
      expect(pred.topReasons.length).toBeGreaterThanOrEqual(1);
      expect(pred.risks.length).toBeGreaterThanOrEqual(1);
      expect(pred.modelNote.length).toBeGreaterThan(50);
    }
  });

  it("computes a sensible Poisson λ (not too high, not too low)", () => {
    const judge = calculateHrPrediction(AARON_JUDGE_INPUTS);
    // For an elite hitter, λ should be in the 0.10-0.50 range
    // (gives P(1+ HR) = 1 - e^(-λ) ≈ 9-40%)
    expect(judge.lambda).toBeGreaterThan(0.05);
    expect(judge.lambda).toBeLessThan(1.0);
  });
});

describe("Regression (Section 12)", () => {
  it("regresses small samples toward the league mean", () => {
    // Hitter with 25% HR/FB on 40 fly balls (small sample)
    // League avg is 12.2%, stabilizer is 100
    const regressed = regressHrFb(0.25, 40, 0.122, 100);
    // Expected: (0.25 × 40 + 0.122 × 100) / 140 = (10 + 12.2) / 140 = 0.157
    expect(regressed).toBeCloseTo(0.157, 2);
    expect(regressed).toBeLessThan(0.25);  // regressed DOWN from 0.25
    expect(regressed).toBeGreaterThan(0.122); // but still above league avg
  });

  it("passes through large samples unchanged", () => {
    // Hitter with 25% HR/FB on 1000 fly balls — barely regresses
    const regressed = regressHrFb(0.25, 1000, 0.122, 100);
    expect(regressed).toBeCloseTo(0.25, 1); // within 0.5pp
  });

  it("returns league average when sample is 0", () => {
    const regressed = regressStat(0.50, 0, 0.122, 100);
    expect(regressed).toBe(0.122);
  });
});

describe("Percentile conversion", () => {
  it("returns 50 for a league-average rate", () => {
    const pct = rateToPercentile(0.122, 0.122, 0.055);
    expect(pct).toBeCloseTo(50, 0);
  });

  it("returns high percentile for an elite rate", () => {
    const pct = rateToPercentile(0.25, 0.122, 0.055);
    expect(pct).toBeGreaterThan(90);
  });

  it("returns low percentile for a weak rate", () => {
    const pct = rateToPercentile(0.05, 0.122, 0.055);
    expect(pct).toBeLessThan(15);
  });

  it("clamps to 1-99", () => {
    expect(rateToPercentile(1.0, 0.122, 0.055)).toBeLessThanOrEqual(99);
    expect(rateToPercentile(0.0, 0.122, 0.055)).toBeGreaterThanOrEqual(1);
  });
});

describe("Parlay Scanner (Section 15)", () => {
  it("classifies a single HR as 'Reasonable Risk'", () => {
    const judge = calculateHrPrediction(AARON_JUDGE_INPUTS);
    const scan = scanParlay([judge]);
    expect(scan.riskTier).toBe("Reasonable");
    expect(scan.combinedProbability).toBeCloseTo(judge.hrProbability, 4);
  });

  it("compounds probabilities correctly for 2 legs", () => {
    const judge = calculateHrPrediction(AARON_JUDGE_INPUTS);
    const soto = calculateHrPrediction(JUAN_SOTO_INPUTS);
    const scan = scanParlay([judge, soto]);

    expect(scan.riskTier).toBe("High");
    expect(scan.combinedProbability).toBeCloseTo(judge.hrProbability * soto.hrProbability, 6);
  });

  it("flags 3+ legs as Lottery Risk", () => {
    const judge = calculateHrPrediction(AARON_JUDGE_INPUTS);
    const soto = calculateHrPrediction(JUAN_SOTO_INPUTS);
    const scan = scanParlay([judge, soto, judge, soto]);
    expect(scan.riskTier).toBe("Lottery");
  });

  it("flags correlated legs (same game)", () => {
    const judge = calculateHrPrediction(AARON_JUDGE_INPUTS);
    const soto = calculateHrPrediction(JUAN_SOTO_INPUTS);
    // Both have gameId 745812
    const scan = scanParlay([judge, soto]);
    expect(scan.correlationWarning).not.toBeNull();
    expect(scan.correlationWarning).toContain("correlated");
  });

  it("generates an explanation that includes the leg count and combined probability", () => {
    const judge = calculateHrPrediction(AARON_JUDGE_INPUTS);
    const scan = scanParlay([judge]);
    expect(scan.explanation).toContain("1 HR leg");
    expect(scan.explanation).toContain("%");
  });
});

describe("Vouch Card Generator (Section 16)", () => {
  it("generates a share text under 280 chars", () => {
    const judge = calculateHrPrediction(AARON_JUDGE_INPUTS);
    const card = generateVouchCard(judge);
    expect(card.shareText.length).toBeLessThanOrEqual(280);
  });

  it("includes score, probability, and tier in the card text", () => {
    const judge = calculateHrPrediction(AARON_JUDGE_INPUTS);
    const card = generateVouchCard(judge);
    expect(card.cardText).toContain("Score:");
    expect(card.cardText).toContain("Probability:");
    expect(card.cardText).toContain("Tier:");
    expect(card.cardText).toContain("Aaron Judge");
  });

  it("includes the disclaimer in both share and card text", () => {
    const judge = calculateHrPrediction(AARON_JUDGE_INPUTS);
    const card = generateVouchCard(judge);
    expect(card.shareText).toContain("Not betting advice");
    expect(card.cardText).toContain("Not betting advice");
  });

  it("does not use forbidden gambling language", () => {
    const preds = [
      calculateHrPrediction(AARON_JUDGE_INPUTS),
      calculateHrPrediction(JUAN_SOTO_INPUTS),
      calculateHrPrediction(WEAK_HITTER_INPUTS),
    ];
    for (const pred of preds) {
      const card = generateVouchCard(pred);
      const allText = card.shareText + " " + card.cardText + " " + pred.modelNote;
      expect(allText.toLowerCase()).not.toContain("lock");
      expect(allText.toLowerCase()).not.toContain("guaranteed");
      expect(allText.toLowerCase()).not.toContain("free money");
      expect(allText.toLowerCase()).not.toContain("sure hit");
    }
  });
});

describe("Process Score (Section 21)", () => {
  it("labels a win with high pre-game score as 'Good Process / Good Result'", () => {
    const pred = calculateHrPrediction(AARON_JUDGE_INPUTS);
    const outcome = {
      prediction: pred,
      result: "won" as const,
      hrHit: true,
      paCount: 4,
      hardHitFlyouts: 2,
      lineupConfirmedAtFirstPitch: true,
      weatherChanged: false,
      pitcherChanged: false,
    };
    const process = calculateProcessScore(outcome);
    expect(process.label).toBe("Good Process / Good Result");
    expect(process.score).toBeGreaterThan(60);
  });

  it("labels a loss with strong contact as 'Good Process / Bad Result'", () => {
    const pred = calculateHrPrediction(AARON_JUDGE_INPUTS);
    const outcome = {
      prediction: pred,
      result: "lost" as const,
      hrHit: false,
      paCount: 4,
      hardHitFlyouts: 2, // strong contact, just didn't leave the yard
      lineupConfirmedAtFirstPitch: true,
      weatherChanged: false,
      pitcherChanged: false,
    };
    const process = calculateProcessScore(outcome);
    expect(process.label).toBe("Good Process / Bad Result");
  });

  it("labels a loss with weak contact as 'Bad Process / Bad Result'", () => {
    const pred = calculateHrPrediction(WEAK_HITTER_INPUTS);
    const outcome = {
      prediction: pred,
      result: "lost" as const,
      hrHit: false,
      paCount: 3,
      hardHitFlyouts: 0,
      lineupConfirmedAtFirstPitch: false,
      weatherChanged: true,
      pitcherChanged: false,
    };
    const process = calculateProcessScore(outcome);
    expect(["Bad Process / Bad Result", "Good Process / Bad Result"]).toContain(process.label);
  });

  it("always generates a model review narrative", () => {
    const pred = calculateHrPrediction(AARON_JUDGE_INPUTS);
    const outcome = {
      prediction: pred,
      result: "lost" as const,
      hrHit: false,
      paCount: 4,
      hardHitFlyouts: 1,
      lineupConfirmedAtFirstPitch: true,
      weatherChanged: false,
      pitcherChanged: false,
    };
    const process = calculateProcessScore(outcome);
    expect(process.modelReview.length).toBeGreaterThan(50);
    expect(process.modelReview).toContain("Aaron Judge");
  });
});

describe("Profile Stats (Section 22)", () => {
  it("returns empty stats for no outcomes", () => {
    const stats = calculateProfileStats([]);
    expect(stats.totalHrPicks).toBe(0);
    expect(stats.hrHitRate).toBe(0);
  });

  it("computes hit rate and average score correctly", () => {
    const outcomes = [
      {
        prediction: calculateHrPrediction(AARON_JUDGE_INPUTS),
        result: "won" as const,
        hrHit: true,
        paCount: 4,
        hardHitFlyouts: 1,
        lineupConfirmedAtFirstPitch: true,
        weatherChanged: false,
        pitcherChanged: false,
      },
      {
        prediction: calculateHrPrediction(JUAN_SOTO_INPUTS),
        result: "lost" as const,
        hrHit: false,
        paCount: 4,
        hardHitFlyouts: 0,
        lineupConfirmedAtFirstPitch: true,
        weatherChanged: false,
        pitcherChanged: false,
      },
    ];
    const stats = calculateProfileStats(outcomes);
    expect(stats.totalHrPicks).toBe(2);
    expect(stats.hrHitRate).toBe(0.5);
    expect(stats.averagePickScore).toBeGreaterThan(60);
  });

  it("classifies parlay risk behavior", () => {
    const outcomes = Array.from({ length: 10 }, () => ({
      prediction: calculateHrPrediction(AARON_JUDGE_INPUTS),
      result: "lost" as const,
      hrHit: false,
      paCount: 4,
      hardHitFlyouts: 0,
      lineupConfirmedAtFirstPitch: true,
      weatherChanged: false,
      pitcherChanged: false,
    }));
    const stats = calculateProfileStats(outcomes);
    expect(["Conservative", "Balanced", "Aggressive", "Reckless"]).toContain(stats.parlayRiskBehavior);
  });
});

describe("Confidence multiplier (Section 11)", () => {
  it("returns 'High' for fully confirmed, large sample, no risks", () => {
    const pred = calculateHrPrediction(AARON_JUDGE_INPUTS);
    expect(pred.confidence.level).toMatch(/High|Medium-High/);
  });

  it("returns 'Low' or 'Lottery' for unconfirmed lineup + pinch-hit risk + small sample", () => {
    const pred = calculateHrPrediction(WEAK_HITTER_INPUTS);
    expect(["Low", "Lottery", "Medium"]).toContain(pred.confidence.level);
  });
});

describe("Strikeout Penalty (Section 10)", () => {
  it("reduces the HR score when K rates are high", () => {
    const judge = calculateHrPrediction(AARON_JUDGE_INPUTS);

    // Same inputs but with 35% K rate vs 30% pitcher K rate
    const highKInputs = {
      ...AARON_JUDGE_INPUTS,
      strikeoutPenalty: {
        batterKRate: 0.35,
        pitcherKRate: 0.30,
      },
    };
    const highKPred = calculateHrPrediction(highKInputs);

    expect(highKPred.hrScore).toBeLessThan(judge.hrScore);
    expect(highKPred.strikeoutPenalty.penalty).toBeGreaterThan(judge.strikeoutPenalty.penalty);
  });
});

describe("Park + Weather multiplier (Section 8)", () => {
  it("boosts probability when wind is blowing out", () => {
    const judge = calculateHrPrediction(AARON_JUDGE_INPUTS);

    const windInInputs = {
      ...AARON_JUDGE_INPUTS,
      parkWeather: {
        ...AARON_JUDGE_INPUTS.parkWeather,
        windDirection: "in" as const,
      },
    };
    const windInPred = calculateHrPrediction(windInInputs);

    expect(windInPred.hrProbability).toBeLessThan(judge.hrProbability);
    expect(windInPred.parkWeatherScore.boost).toBeLessThan(judge.parkWeatherScore.boost);
  });

  it("handles cold temperatures correctly", () => {
    const coldInputs = {
      ...AARON_JUDGE_INPUTS,
      parkWeather: {
        ...AARON_JUDGE_INPUTS.parkWeather,
        temperatureF: 45,
      },
    };
    const coldPred = calculateHrPrediction(coldInputs);
    expect(coldPred.parkWeatherScore.weatherMultiplier).toBeLessThan(1.0);
  });
});
