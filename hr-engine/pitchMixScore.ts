/**
 * Pitch Mix Matchup Score (Section 6)
 *
 * Formula:
 *   Pitch Matchup Score =
 *     (Pitcher Fastball% × Hitter xSLG vs Fastball)
 *     + (Pitcher Slider% × Hitter xSLG vs Slider)
 *     + (Pitcher Changeup% × Hitter xSLG vs Changeup)
 *     + (Pitcher Curveball% × Hitter xSLG vs Curveball)
 *     + (Pitcher Cutter% × Hitter xSLG vs Cutter)
 *     + (Pitcher Sinker% × Hitter xSLG vs Sinker)
 *
 * Then convert to score:
 *   Pitch Mix Score = Pitch Matchup xSLG × 100
 *
 * Convert to multiplier for Poisson:
 *   xSLG .500 = average → multiplier 1.00
 *   xSLG .600 = strong → multiplier 1.20
 *   xSLG .400 = weak → multiplier 0.80
 */

import { PitchMixInputs, PitchMixResult } from "./types";

interface PitchTypeBreakdown {
  rate: number;
  xslg: number;
  name: string;
}

export function calculatePitchMixScore(inputs: PitchMixInputs): PitchMixResult {
  const pitches: PitchTypeBreakdown[] = [
    { rate: inputs.pitcherFastballRate, xslg: inputs.hitterXslgVsFastball, name: "Fastball" },
    { rate: inputs.pitcherSliderRate,   xslg: inputs.hitterXslgVsSlider,   name: "Slider" },
    { rate: inputs.pitcherChangeupRate, xslg: inputs.hitterXslgVsChangeup, name: "Changeup" },
    { rate: inputs.pitcherCurveballRate,xslg: inputs.hitterXslgVsCurveball,name: "Curveball" },
    { rate: inputs.pitcherCutterRate,   xslg: inputs.hitterXslgVsCutter,   name: "Cutter" },
    { rate: inputs.pitcherSinkerRate,   xslg: inputs.hitterXslgVsSinker,   name: "Sinker" },
  ].filter(p => p.rate > 0);

  // Calculate weighted expected xSLG
  const totalRate = pitches.reduce((sum, p) => sum + p.rate, 0);
  if (totalRate === 0) {
    return {
      score: 50,
      expectedXslg: 0.400,
      bestMatchupPitch: "Unknown",
      riskPitch: "Unknown",
      edge: "Neutral",
      label: "No pitch mix data available",
    };
  }

  const expectedXslg = pitches.reduce(
    (sum, p) => sum + (p.rate / totalRate) * p.xslg,
    0
  );

  // Score: xSLG of .500 = 100, .400 = 50, .300 = 0
  // Linear mapping: score = (xslg - 0.300) / 0.002
  const score = Math.max(0, Math.min(100, (expectedXslg - 0.300) / 0.002));

  // Find best and worst pitch matchups
  const sortedByXslg = [...pitches].sort((a, b) => b.xslg - a.xslg);
  const bestMatchup = sortedByXslg[0];
  const riskPitch = sortedByXslg[sortedByXslg.length - 1];

  let edge: PitchMixResult["edge"] = "Neutral";
  if (expectedXslg >= 0.500) edge = "Positive";
  else if (expectedXslg <= 0.400) edge = "Negative";

  return {
    score: Math.round(score * 10) / 10,
    expectedXslg: Math.round(expectedXslg * 1000) / 1000,
    bestMatchupPitch: bestMatchup.name,
    riskPitch: riskPitch.name,
    edge,
    label: getPitchMixLabel(expectedXslg, bestMatchup.name, riskPitch.name),
  };
}

function getPitchMixLabel(expectedXslg: number, bestPitch: string, riskPitch: string): string {
  if (expectedXslg >= 0.550) {
    return `Strong pitch-mix edge — damages ${bestPitch.toLowerCase()}s, pitcher throws them often`;
  }
  if (expectedXslg >= 0.480) {
    return `Positive matchup — best damage vs ${bestPitch.toLowerCase()}`;
  }
  if (expectedXslg >= 0.420) {
    return `Neutral matchup — risk pitch is the ${riskPitch.toLowerCase()}`;
  }
  return `Negative matchup — pitcher can neutralize with ${riskPitch.toLowerCase()}s`;
}

/**
 * Convert pitch mix score to a Poisson multiplier.
 * Score 50 → 1.00
 * Score 75 → 1.10
 * Score 25 → 0.90
 */
export function pitchMixToMultiplier(score: number): number {
  return 1 + (score - 50) / 250;
}
