/**
 * HR Pick Explanation Generator (Section 25)
 *
 * Generates the top 3 reasons + top 2 risks + narrative model note
 * for every HR prediction. This is what makes VouchEdge feel like
 * an analyst explaining the math, not just spitting out a pick.
 *
 * Template:
 *   [Player] is a [Tier] HR target today.
 *   Main reasons:
 *   1. [Hitter power reason]
 *   2. [Pitcher weakness reason]
 *   3. [Park/weather/matchup reason]
 *   Risks:
 *   1. [Strikeout risk]
 *   2. [Lineup/weather/sample risk]
 *   Model view:
 *   [Probability]% HR probability, [Score]/100 score, [Confidence] confidence.
 */

import { HrPrediction } from "./types";

export interface ReasonsResult {
  topReasons: string[];   // 3 reasons (strings starting with ✅)
  risks: string[];        // 2 risks (strings starting with ⚠️)
  modelNote: string;      // Full narrative
}

export function generateHrReasons(prediction: HrPrediction): ReasonsResult {
  const reasons: Array<{ text: string; weight: number }> = [];
  const risks: Array<{ text: string; weight: number }> = [];

  // ===== REASONS (positive signals) =====

  // 1. Hitter power
  if (prediction.hitterPowerScore.score >= 80) {
    reasons.push({
      text: `Elite barrel profile (${(prediction.hitterPowerScore.barrelRate * 100).toFixed(1)}% Barrel%, ${prediction.hitterPowerScore.iso.toFixed(3)} ISO)`,
      weight: prediction.hitterPowerScore.score,
    });
  } else if (prediction.hitterPowerScore.score >= 65) {
    reasons.push({
      text: `Above-average power (${(prediction.hitterPowerScore.barrelRate * 100).toFixed(1)}% Barrel%)`,
      weight: prediction.hitterPowerScore.score,
    });
  }

  // 2. Barrel form (recent hot streak)
  if (prediction.barrelFormScore.trend === "heating_up") {
    reasons.push({
      text: `Heating up — ${(prediction.barrelFormScore.last7BarrelRate * 100).toFixed(1)}% Barrel% over last 7 days`,
      weight: prediction.barrelFormScore.score + 5,
    });
  }

  // 3. Pitcher vulnerability
  if (prediction.pitcherVulnerabilityScore.score >= 75) {
    reasons.push({
      text: `Pitcher allows elevated contact (${prediction.pitcherVulnerabilityScore.hr9.toFixed(2)} HR/9, ${(prediction.pitcherVulnerabilityScore.barrelAllowed * 100).toFixed(1)}% Barrel allowed)`,
      weight: prediction.pitcherVulnerabilityScore.score,
    });
  } else if (prediction.pitcherVulnerabilityScore.score >= 60) {
    reasons.push({
      text: `Pitcher shows HR vulnerability (${prediction.pitcherVulnerabilityScore.hr9.toFixed(2)} HR/9)`,
      weight: prediction.pitcherVulnerabilityScore.score,
    });
  }

  // 4. Pitch mix edge
  if (prediction.pitchMixScore.edge === "Positive") {
    reasons.push({
      text: `Pitch mix edge — damages ${prediction.pitchMixScore.bestMatchupPitch.toLowerCase()}s, pitcher throws them often`,
      weight: prediction.pitchMixScore.score,
    });
  }

  // 5. Park/weather boost
  if (prediction.parkWeatherScore.boost >= 0.10) {
    reasons.push({
      text: `${prediction.parkWeatherScore.label} (+${(prediction.parkWeatherScore.boost * 100).toFixed(1)}% carry)`,
      weight: 70 + prediction.parkWeatherScore.boost * 100,
    });
  } else if (prediction.parkWeatherScore.boost >= 0.05) {
    reasons.push({
      text: `Slight park/weather boost (+${(prediction.parkWeatherScore.boost * 100).toFixed(1)}%)`,
      weight: 65,
    });
  }

  // 6. Handedness edge
  if (prediction.handednessScore.edge === "Positive") {
    reasons.push({
      text: `Platoon edge — ${(prediction.handednessScore.splitEdge * 1000).toFixed(0)} ISO points above overall vs this hand`,
      weight: 65,
    });
  }

  // 7. Lineup spot
  if (prediction.lineupScore.lineupSpot && prediction.lineupScore.lineupSpot <= 2) {
    reasons.push({
      text: `Top-of-order spot (batting ${prediction.lineupScore.lineupSpot}) — extra PA opportunity`,
      weight: 60,
    });
  }

  // ===== RISKS (negative signals) =====

  // 1. Strikeout penalty (always include if non-trivial)
  if (prediction.strikeoutPenalty.penalty >= 0.05) {
    risks.push({
      text: `${(prediction.strikeoutPenalty.penalty * 100).toFixed(1)}% K penalty — ${(prediction.inputs.strikeoutPenalty.batterKRate * 100).toFixed(0)}% K rate vs ${prediction.inputs.strikeoutPenalty.pitcherKRate >= 0.25 ? "high-K" : "this"} pitcher`,
      weight: prediction.strikeoutPenalty.penalty * 1000,
    });
  }

  // 2. Lineup risk
  if (!prediction.lineupScore.confirmed) {
    risks.push({
      text: "Lineup not yet confirmed",
      weight: 50,
    });
  } else if (prediction.lineupScore.lineupSpot && prediction.lineupScore.lineupSpot >= 8) {
    risks.push({
      text: `Batting ${prediction.lineupScore.lineupSpot}th — limited PA opportunity`,
      weight: 40,
    });
  }

  // 3. Weather risk
  if (prediction.inputs.confidence.weatherUncertainty) {
    risks.push({
      text: "Weather forecast uncertain — game-delay or PPD risk",
      weight: 45,
    });
  } else if (prediction.parkWeatherScore.boost < -0.05) {
    risks.push({
      text: `${prediction.parkWeatherScore.label} (${(prediction.parkWeatherScore.boost * 100).toFixed(1)}% suppression)`,
      weight: 50,
    });
  }

  // 4. Small sample
  if (prediction.barrelFormScore.smallSampleWarning) {
    risks.push({
      text: "Recent barrel sample is small — form reading is uncertain",
      weight: 35,
    });
  }

  // 5. Pinch-hit risk
  if (prediction.inputs.confidence.pinchHitRisk) {
    risks.push({
      text: "Pinch-hit risk in late innings",
      weight: 40,
    });
  }

  // 6. Low probability reminder (HRs are rare)
  if (prediction.hrProbability < 0.10) {
    risks.push({
      text: "HR outcomes are low-frequency events — single-game variance is high",
      weight: 30,
    });
  }

  // 7. Pitch mix risk
  if (prediction.pitchMixScore.edge === "Negative") {
    risks.push({
      text: `Pitch mix disadvantage — risk pitch is ${prediction.pitchMixScore.riskPitch.toLowerCase()}`,
      weight: 45,
    });
  }

  // Sort by weight, take top 3 reasons and top 2 risks
  const topReasons = reasons.sort((a, b) => b.weight - a.weight).slice(0, 3).map(r => `✅ ${r.text}`);
  const topRisks = risks.sort((a, b) => b.weight - a.weight).slice(0, 2).map(r => `⚠️ ${r.text}`);

  // Pad if we don't have enough
  while (topReasons.length < 1) {
    topReasons.push(`✅ ${prediction.tier.description}`);
  }
  while (topRisks.length < 1) {
    topRisks.push("⚠️ HR outcomes remain low-frequency events");
  }

  // Generate the narrative model note
  const modelNote = generateModelNote(prediction, topReasons, topRisks);

  return { topReasons, risks: topRisks, modelNote };
}

function generateModelNote(
  prediction: HrPrediction,
  reasons: string[],
  risks: string[]
): string {
  const playerName = prediction.playerName;
  const tier = prediction.tier.label;
  const probPct = (prediction.hrProbability * 100).toFixed(1);
  const score = prediction.hrScore.toFixed(0);
  const confidence = prediction.confidence.level;

  const cleanReasons = reasons.map(r => r.replace(/^✅\s*/, ""));
  const cleanRisks = risks.map(r => r.replace(/^⚠️\s*/, ""));

  return `${playerName} is a ${tier} today.
Main reasons:
1. ${cleanReasons[0] ?? "Favorable matchup profile"}
2. ${cleanReasons[1] ?? "Multiple positive signals align"}
3. ${cleanReasons[2] ?? "Solid HR environment"}
Risks:
1. ${cleanRisks[0] ?? "HR outcomes are low-frequency events"}
2. ${cleanRisks[1] ?? "Single-game variance is high"}
Model view:
${probPct}% HR probability, ${score}/100 score, ${confidence} confidence.`;
}
