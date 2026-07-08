/**
 * VouchEdge HR Engine — Main Orchestrator (Sections 1 + 2)
 *
 * The single function that powers every HR-related page in the app.
 *
 * Pipeline:
 *   1. Calculate each sub-score (Sections 3-10)
 *   2. Compute baseline Poisson λ from raw inputs
 *   3. Apply multipliers (park, weather, pitch mix, handedness, pitcher weakness, lineup, bullpen)
 *   4. Compute HR Probability = 1 - e^(-λ)
 *   5. Compute composite HR Score (weighted sum of sub-scores, minus K penalty)
 *   6. Apply confidence multiplier to the displayed score
 *   7. Assign tier based on adjusted score
 *   8. Generate reasons + risks + model note
 *
 * Usage:
 *   import { calculateHrPrediction } from "./hrEngine";
 *   const prediction = calculateHrPrediction(inputs);
 *
 *   // Every page just renders the prediction:
 *   <HrCard prediction={prediction} />
 *
 * Math reference (Section 1):
 *   λ = Expected PA × Contact Rate × FB% × Regressed HR/FB%
 *       × Park HR Factor × Weather Factor × Pitch Mix Factor
 *       × Handedness Factor × Pitcher HR Weakness Factor
 *       × Lineup Factor × Bullpen Factor
 *
 *   HR Probability = 1 - e^(-λ)
 *
 * Math reference (Section 2):
 *   VouchEdge HR Score =
 *     (Hitter Power Score × 0.25)
 *     + (Barrel Form Score × 0.20)
 *     + (Pitcher Vulnerability Score × 0.20)
 *     + (Pitch Mix Score × 0.15)
 *     + (Park/Weather Score × 0.10)
 *     + (Lineup Context Score × 0.05)
 *     + (Bullpen Weakness Score × 0.05)
 *     - Strikeout Penalty
 */

import {
  HrEngineInputs,
  HrPrediction,
} from "./types";
import {
  HR_SCORE_WEIGHTS,
  LEAGUE_AVERAGES,
} from "./constants";
import { regressHrFb } from "./regression";

import { calculateHitterPowerScore } from "./hitterPowerScore";
import { calculateBarrelFormScore } from "./barrelFormScore";
import {
  calculatePitcherVulnerabilityScore,
  pitcherVulnerabilityToMultiplier,
} from "./pitcherVulnerabilityScore";
import {
  calculatePitchMixScore,
  pitchMixToMultiplier,
} from "./pitchMixScore";
import { calculateHandednessScore } from "./handednessScore";
import { calculateParkWeatherScore } from "./parkWeatherScore";
import { calculateLineupScore } from "./lineupScore";
import { calculateBullpenScore } from "./bullpenScore";
import { calculateStrikeoutPenalty } from "./strikeoutPenalty";
import { calculateConfidence } from "./confidence";
import { assignHrTier } from "./tiers";
import { generateHrReasons } from "./reasons";

/**
 * The main entry point. Given a full bundle of inputs, returns a complete
 * HR prediction that every page in the app can render.
 *
 * This function is pure — same inputs always produce same outputs.
 * Safe to memoize, safe to call from server or client.
 */
export function calculateHrPrediction(inputs: HrEngineInputs): HrPrediction {
  // ===== Step 1: Calculate all sub-scores =====
  const hitterPowerScore = calculateHitterPowerScore(inputs.hitterPower);
  const barrelFormScore = calculateBarrelFormScore(inputs.barrelForm);
  const pitcherVulnerabilityScore = calculatePitcherVulnerabilityScore(inputs.pitcherVulnerability);
  const pitchMixScore = calculatePitchMixScore(inputs.pitchMix);
  const handednessScore = calculateHandednessScore(inputs.handedness);
  const parkWeatherScore = calculateParkWeatherScore(inputs.parkWeather);
  const lineupScore = calculateLineupScore(inputs.lineup);
  const bullpenScore = calculateBullpenScore(inputs.bullpen);
  const confidence = calculateConfidence(inputs.confidence);

  // ===== Step 2: Compute the Poisson λ =====
  // Baseline λ = Expected PA × Contact Rate × FB% × Regressed HR/FB%
  // (Regress HR/FB toward the league mean using Section 12 formula)
  const regressedHrFb = regressHrFb(
    inputs.hitterPower.hrFbRate,
    inputs.barrelForm.last15BattedBalls + inputs.barrelForm.last7BattedBalls, // rough fly ball estimate
    LEAGUE_AVERAGES.hrFbRate
  );

  const baselineLambda =
    inputs.expectedPA *
    inputs.contactRate *
    inputs.flyBallRate *
    regressedHrFb;

  // ===== Step 3: Apply multipliers =====
  const parkMultiplier = parkWeatherScore.parkMultiplier;
  const weatherMultiplier = parkWeatherScore.weatherMultiplier;
  const pitchMixMultiplier = pitchMixToMultiplier(pitchMixScore.score);
  const handednessMultiplier = handednessScore.multiplier;
  const pitcherWeaknessMultiplier = pitcherVulnerabilityToMultiplier(pitcherVulnerabilityScore.score);
  const lineupMultiplier = lineupScore.multiplier;
  const bullpenMultiplier = bullpenScore.multiplier;

  const combinedMultiplier =
    parkMultiplier *
    weatherMultiplier *
    pitchMixMultiplier *
    handednessMultiplier *
    pitcherWeaknessMultiplier *
    lineupMultiplier *
    bullpenMultiplier;

  const lambda = baselineLambda * combinedMultiplier;

  // ===== Step 4: HR Probability (Poisson P(at least 1 HR)) =====
  const hrProbability = 1 - Math.exp(-lambda);

  // ===== Step 5: Composite HR Score (weighted sum, pre-K-penalty) =====
  const rawHrScore =
    hitterPowerScore.score * HR_SCORE_WEIGHTS.hitterPower +
    barrelFormScore.score * HR_SCORE_WEIGHTS.barrelForm +
    pitcherVulnerabilityScore.score * HR_SCORE_WEIGHTS.pitcherVulnerability +
    pitchMixScore.score * HR_SCORE_WEIGHTS.pitchMix +
    (parkWeatherScore.boost * 100 + 50) * HR_SCORE_WEIGHTS.parkWeather +  // boost → 0-100 scale
    ((lineupScore.multiplier - 0.88) / 0.20) * 100 * HR_SCORE_WEIGHTS.lineup +  // mult 0.88-1.08 → 0-100
    ((bullpenScore.multiplier - 0.85) / 0.35) * 100 * HR_SCORE_WEIGHTS.bullpen; // mult 0.85-1.20 → 0-100

  // ===== Step 6: Apply strikeout penalty =====
  const strikeoutPenalty = calculateStrikeoutPenalty(
    inputs.strikeoutPenalty,
    rawHrScore
  );

  // ===== Step 7: Apply confidence multiplier to get displayed score =====
  const displayedScore = strikeoutPenalty.adjustedScore * confidence.multiplier;

  // ===== Step 8: Assign tier =====
  const tier = assignHrTier(displayedScore);

  // ===== Build the prediction object =====
  const prediction: HrPrediction = {
    playerId: inputs.playerId,
    playerName: inputs.playerName,
    team: inputs.team,
    opponent: inputs.opponent,
    pitcherName: inputs.pitcherName,
    gameId: inputs.gameId,

    hrProbability: Math.round(hrProbability * 10000) / 10000,
    hrScore: Math.round(displayedScore * 10) / 10,
    confidence,
    tier,

    lambda: Math.round(lambda * 10000) / 10000,
    baselineLambda: Math.round(baselineLambda * 10000) / 10000,
    multiplier: Math.round(combinedMultiplier * 1000) / 1000,

    hitterPowerScore,
    barrelFormScore,
    pitcherVulnerabilityScore,
    pitchMixScore,
    parkWeatherScore,
    lineupScore,
    bullpenScore,
    strikeoutPenalty,
    handednessScore,

    parkMultiplier,
    weatherMultiplier,
    pitchMixMultiplier,
    handednessMultiplier,
    pitcherWeaknessMultiplier,
    lineupMultiplier,
    bullpenMultiplier,

    inputs,

    // Placeholder — filled in below
    topReasons: [],
    risks: [],
    modelNote: "",
  };

  // ===== Step 9: Generate reasons + risks + model note =====
  const explanation = generateHrReasons(prediction);
  prediction.topReasons = explanation.topReasons;
  prediction.risks = explanation.risks;
  prediction.modelNote = explanation.modelNote;

  return prediction;
}

/**
 * Batch helper — calculate predictions for multiple hitters in the same game.
 * Useful for the HR Board and Dashboard which show all of today's targets.
 */
export function calculateHrPredictionsBatch(
  inputsList: HrEngineInputs[]
): HrPrediction[] {
  return inputsList
    .map(calculateHrPrediction)
    .sort((a, b) => b.hrScore - a.hrScore);
}

/**
 * Convenience: get just the score + tier for compact UI lists.
 */
export function getHrScoreSummary(inputs: HrEngineInputs): {
  score: number;
  probability: number;
  tier: string;
  confidence: string;
} {
  const pred = calculateHrPrediction(inputs);
  return {
    score: pred.hrScore,
    probability: pred.hrProbability,
    tier: pred.tier.label,
    confidence: pred.confidence.level,
  };
}
