/**
 * Process Score (Section 21)
 *
 * After a game, grade the PROCESS — not just the result.
 *
 * Why: HR picks lose often even when they are good. A 9% probability hit
 * that didn't cash is still a good process. A 30% probability hit that
 * happened to cash is lucky.
 *
 * Labels:
 *   Good Process / Good Result  — model was right, hitter delivered
 *   Good Process / Bad Result   — model was right, hitter didn't deliver (variance)
 *   Bad Process / Bad Result    — model was wrong, hitter didn't deliver
 *   Lucky Win                    — model was wrong, but hitter delivered anyway
 *
 * Process Score =
 *   (Pre-game Score Accuracy × 0.35)
 *   + (Contact Quality Outcome × 0.25)
 *   + (Matchup Logic Accuracy × 0.25)
 *   + (Data Certainty × 0.15)
 */

import { HrPrediction, PickOutcome, ProcessScoreResult } from "./types";
import { PROCESS_SCORE_WEIGHTS } from "./constants";

export function calculateProcessScore(outcome: PickOutcome): ProcessScoreResult {
  const pred = outcome.prediction;

  // 1. Pre-game Score Accuracy (was the model's probability reasonable?)
  // Elite targets hit ~10%, strong ~8%, good ~6%, sneaky ~4%, avoid ~2%
  // If the actual result aligns with the predicted tier, accuracy is high
  const expectedHitRate = tierToExpectedHitRate(pred.tier.tier);
  const preGameAccuracy = calculatePreGameAccuracy(
    pred.hrProbability,
    expectedHitRate,
    outcome.hrHit
  );

  // 2. Contact Quality Outcome (did the hitter barrel balls / hit fly balls hard?)
  const contactQuality = calculateContactQuality(outcome);

  // 3. Matchup Logic Accuracy (did the matchup play out as predicted?)
  const matchupLogicAccuracy = calculateMatchupLogic(outcome);

  // 4. Data Certainty (was the pre-game data high quality?)
  const dataCertainty = calculateDataCertainty(pred);

  // Weighted sum
  const score =
    preGameAccuracy * PROCESS_SCORE_WEIGHTS.preGameAccuracy +
    contactQuality.score * PROCESS_SCORE_WEIGHTS.contactQuality +
    matchupLogicAccuracy * PROCESS_SCORE_WEIGHTS.matchupLogic +
    dataCertainty * PROCESS_SCORE_WEIGHTS.dataCertainty;

  // Label
  const label = getLabel(outcome, score);

  // Narrative review
  const modelReview = buildModelReview(outcome, score, contactQuality, matchupLogicAccuracy);

  return {
    score: Math.round(score * 10) / 10,
    label,
    preGameScore: pred.hrScore,
    finalProbability: pred.hrProbability,
    contactQuality: contactQuality.label,
    matchupLogicAccuracy: Math.round(matchupLogicAccuracy * 10) / 10,
    dataCertainty: Math.round(dataCertainty * 10) / 10,
    modelReview,
  };
}

function tierToExpectedHitRate(tier: string): number {
  switch (tier) {
    case "Elite":  return 0.10;
    case "Strong": return 0.08;
    case "Good":   return 0.06;
    case "Sneaky": return 0.04;
    case "Avoid":  return 0.02;
    default:       return 0.05;
  }
}

function calculatePreGameAccuracy(
  predictedProb: number,
  expectedHitRate: number,
  hrHit: boolean
): number {
  // How close was the predicted probability to the expected hit rate for the tier?
  const predictionAccuracy = 100 - Math.abs(predictedProb - expectedHitRate) * 1000;

  // If HR hit and probability was high → boost
  // If HR didn't hit and probability was low → boost
  // If HR hit but probability was low → penalty (lucky)
  // If HR didn't hit but probability was high → no penalty (variance)
  let outcomeAlignment = 50;
  if (hrHit && predictedProb >= expectedHitRate) outcomeAlignment = 90;
  else if (!hrHit && predictedProb <= expectedHitRate) outcomeAlignment = 80;
  else if (hrHit && predictedProb < expectedHitRate) outcomeAlignment = 30;
  else if (!hrHit && predictedProb > expectedHitRate) outcomeAlignment = 60;

  return (predictionAccuracy + outcomeAlignment) / 2;
}

interface ContactQualityResult {
  score: number;
  label: "Strong" | "Mixed" | "Weak";
}

function calculateContactQuality(outcome: PickOutcome): ContactQualityResult {
  // Heuristic: hard-hit flyouts suggest the process was right, just bad luck
  if (outcome.hardHitFlyouts >= 2) {
    return { score: 85, label: "Strong" };
  }
  if (outcome.hardHitFlyouts === 1) {
    return { score: 70, label: "Mixed" };
  }
  if (outcome.paCount >= 4 && outcome.hardHitFlyouts === 0) {
    return { score: 35, label: "Weak" };
  }
  return { score: 55, label: "Mixed" };
}

function calculateMatchupLogic(outcome: PickOutcome): number {
  let score = 70;

  // If lineup was confirmed at first pitch, logic was sound
  if (outcome.lineupConfirmedAtFirstPitch) score += 10;
  else score -= 15;

  // If weather changed, the matchup logic might have been disrupted
  if (outcome.weatherChanged) score -= 10;

  // If pitcher changed, the original matchup logic is moot
  if (outcome.pitcherChanged) score -= 20;

  return Math.max(0, Math.min(100, score));
}

function calculateDataCertainty(pred: HrPrediction): number {
  // Convert confidence level to a 0-100 score
  switch (pred.confidence.level) {
    case "High":         return 95;
    case "Medium-High":  return 80;
    case "Medium":       return 65;
    case "Low":          return 45;
    case "Lottery":      return 25;
    default:             return 60;
  }
}

function getLabel(outcome: PickOutcome, score: number): ProcessScoreResult["label"] {
  const goodProcess = score >= 60;
  const goodResult = outcome.result === "won";

  if (goodProcess && goodResult) return "Good Process / Good Result";
  if (goodProcess && !goodResult) return "Good Process / Bad Result";
  if (!goodProcess && !goodResult) return "Bad Process / Bad Result";
  return "Lucky Win";
}

function buildModelReview(
  outcome: PickOutcome,
  score: number,
  contactQuality: ContactQualityResult,
  matchupLogic: number
): string {
  const pred = outcome.prediction;
  const playerName = pred.playerName;
  const result = outcome.result === "won" ? "Hit" : "Lost";
  const probPct = (pred.hrProbability * 100).toFixed(1);

  let review = `${playerName} HR — Result: ${result}.\n`;
  review += `Pre-game score: ${pred.hrScore.toFixed(0)}/100. Probability: ${probPct}%.\n`;

  if (outcome.result === "won") {
    review += `HR hit in ${outcome.paCount} PA. `;
    if (score < 60) {
      review += `Lucky win — model was uncertain but the hitter delivered.`;
    } else {
      review += `Good process, good result — model and outcome aligned.`;
    }
  } else {
    review += `${outcome.paCount} PA, ${outcome.hardHitFlyouts} hard-hit flyout(s). `;
    if (contactQuality.label === "Strong") {
      review += `Good process, bad result — contact quality remained strong, just didn't leave the yard.`;
    } else if (score >= 60) {
      review += `Good process, bad result — HR outcomes are low-frequency, variance is expected.`;
    } else {
      review += `Bad process, bad result — matchup didn't play out as predicted.`;
    }
  }

  return review;
}
