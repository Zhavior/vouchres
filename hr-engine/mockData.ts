/**
 * Mock data — realistic test fixtures for the HR engine.
 *
 * Use these to:
 *   - Test the engine without real Statcast access
 *   - Demo the UI with realistic-looking predictions
 *   - Verify the math produces sensible outputs
 *
 * Three profiles:
 *   1. AARON_JUDGE_INPUTS — elite slugger, strong matchup, wind out → high score
 *   2. JUAN_SOTO_INPUTS — elite slugger, neutral matchup → strong score
 *   3. WEAK_HITTER_INPUTS — below-average slugger, tough matchup → low score
 */

import { HrEngineInputs } from "./types";

export const AARON_JUDGE_INPUTS: HrEngineInputs = {
  playerId: "judge-001",
  playerName: "Aaron Judge",
  team: "NYY",
  opponent: "BAL",
  pitcherName: "Cole Irvin",
  gameId: "745812",

  expectedPA: 4.4,
  contactRate: 0.73,           // 27% K rate
  flyBallRate: 0.40,
  bbRate: 0.18,
  hitterHand: "R",

  hitterPower: {
    iso: 0.318,
    barrelRate: 0.165,
    hardHitRate: 0.55,
    hrFbRate: 0.24,
    isoPercentile: 99,
    barrelPercentile: 99,
    hardHitPercentile: 96,
    hrFbPercentile: 98,
  },

  barrelForm: {
    seasonBarrelRate: 0.165,
    last15BarrelRate: 0.185,
    last7BarrelRate: 0.21,
    last7HardHitRate: 0.60,
    last15BattedBalls: 52,
    last7BattedBalls: 23,
  },

  pitcherVulnerability: {
    hr9: 1.42,
    barrelAllowed: 0.092,
    hardHitAllowed: 0.42,
    fbAllowed: 0.40,
    bbRate: 0.075,
    middleMiddleRate: 0.06,
    meatballRate: 0.04,
    hr9Percentile: 78,
    barrelAllowedPercentile: 72,
    hardHitAllowedPercentile: 68,
    fbAllowedPercentile: 65,
  },

  pitchMix: {
    pitcherFastballRate: 0.48,
    pitcherSliderRate: 0.28,
    pitcherChangeupRate: 0.14,
    pitcherCurveballRate: 0.10,
    pitcherCutterRate: 0,
    pitcherSinkerRate: 0,
    hitterXslgVsFastball: 0.620,
    hitterXslgVsSlider: 0.480,
    hitterXslgVsChangeup: 0.510,
    hitterXslgVsCurveball: 0.430,
    hitterXslgVsCutter: 0.500,
    hitterXslgVsSinker: 0.550,
  },

  handedness: {
    hitterIsoVsHand: 0.330,    // vs LHP
    hitterOverallIso: 0.318,
    pitcherHrAllowedVsHand: 1.55,
  },

  parkWeather: {
    parkHrFactor: 112,         // Yankee Stadium
    temperatureF: 85,
    windMph: 10,
    windDirection: "out",
    precipitation: false,
  },

  lineup: {
    lineupSpot: 2,
    lineupConfirmed: true,
    pinchHitRisk: false,
  },

  bullpen: {
    bullpenHr9: 1.30,
    bullpenBarrelAllowed: 0.085,
    bullpenFatigue: 0.3,
    starterExpectedInnings: 5.5,
  },

  strikeoutPenalty: {
    batterKRate: 0.27,
    pitcherKRate: 0.18,
  },

  confidence: {
    lineupConfirmed: true,
    recentSampleSize: "large",
    weatherUncertainty: false,
    pinchHitRisk: false,
    injuryOrRestRisk: false,
    dataQuality: "full",
  },
};

export const JUAN_SOTO_INPUTS: HrEngineInputs = {
  playerId: "soto-001",
  playerName: "Juan Soto",
  team: "NYY",
  opponent: "BAL",
  pitcherName: "Cole Irvin",
  gameId: "745812",

  expectedPA: 4.3,
  contactRate: 0.76,           // 24% K rate
  flyBallRate: 0.36,
  bbRate: 0.20,
  hitterHand: "L",

  hitterPower: {
    iso: 0.270,
    barrelRate: 0.135,
    hardHitRate: 0.48,
    hrFbRate: 0.20,
    isoPercentile: 95,
    barrelPercentile: 90,
    hardHitPercentile: 85,
    hrFbPercentile: 88,
  },

  barrelForm: {
    seasonBarrelRate: 0.135,
    last15BarrelRate: 0.140,
    last7BarrelRate: 0.125,
    last7HardHitRate: 0.50,
    last15BattedBalls: 48,
    last7BattedBalls: 18,
  },

  pitcherVulnerability: {
    hr9: 1.42,
    barrelAllowed: 0.092,
    hardHitAllowed: 0.42,
    fbAllowed: 0.40,
    bbRate: 0.075,
    middleMiddleRate: 0.06,
    meatballRate: 0.04,
    hr9Percentile: 78,
    barrelAllowedPercentile: 72,
    hardHitAllowedPercentile: 68,
    fbAllowedPercentile: 65,
  },

  pitchMix: {
    pitcherFastballRate: 0.48,
    pitcherSliderRate: 0.28,
    pitcherChangeupRate: 0.14,
    pitcherCurveballRate: 0.10,
    pitcherCutterRate: 0,
    pitcherSinkerRate: 0,
    hitterXslgVsFastball: 0.580,
    hitterXslgVsSlider: 0.420,
    hitterXslgVsChangeup: 0.490,
    hitterXslgVsCurveball: 0.400,
    hitterXslgVsCutter: 0.460,
    hitterXslgVsSinker: 0.520,
  },

  handedness: {
    hitterIsoVsHand: 0.290,
    hitterOverallIso: 0.270,
    pitcherHrAllowedVsHand: 1.55,
  },

  parkWeather: {
    parkHrFactor: 112,
    temperatureF: 85,
    windMph: 10,
    windDirection: "out",
    precipitation: false,
  },

  lineup: {
    lineupSpot: 3,
    lineupConfirmed: true,
    pinchHitRisk: false,
  },

  bullpen: {
    bullpenHr9: 1.30,
    bullpenBarrelAllowed: 0.085,
    bullpenFatigue: 0.3,
    starterExpectedInnings: 5.5,
  },

  strikeoutPenalty: {
    batterKRate: 0.24,
    pitcherKRate: 0.18,
  },

  confidence: {
    lineupConfirmed: true,
    recentSampleSize: "medium",
    weatherUncertainty: false,
    pinchHitRisk: false,
    injuryOrRestRisk: false,
    dataQuality: "full",
  },
};

export const WEAK_HITTER_INPUTS: HrEngineInputs = {
  playerId: "weak-001",
  playerName: "Light-Hitting SS",
  team: "SEA",
  opponent: "HOU",
  pitcherName: "Framber Valdez",
  gameId: "745820",

  expectedPA: 3.8,
  contactRate: 0.70,           // 30% K rate
  flyBallRate: 0.28,           // Ground-ball hitter
  bbRate: 0.06,
  hitterHand: "R",

  hitterPower: {
    iso: 0.110,
    barrelRate: 0.040,
    hardHitRate: 0.30,
    hrFbRate: 0.08,
    isoPercentile: 20,
    barrelPercentile: 15,
    hardHitPercentile: 18,
    hrFbPercentile: 22,
  },

  barrelForm: {
    seasonBarrelRate: 0.040,
    last15BarrelRate: 0.030,
    last7BarrelRate: 0.020,
    last7HardHitRate: 0.25,
    last15BattedBalls: 40,
    last7BattedBalls: 15,
  },

  pitcherVulnerability: {
    hr9: 0.78,                  // Elite HR suppressor
    barrelAllowed: 0.060,
    hardHitAllowed: 0.34,
    fbAllowed: 0.30,
    bbRate: 0.05,
    middleMiddleRate: 0.04,
    meatballRate: 0.02,
    hr9Percentile: 25,
    barrelAllowedPercentile: 30,
    hardHitAllowedPercentile: 28,
    fbAllowedPercentile: 35,
  },

  pitchMix: {
    pitcherFastballRate: 0.40,
    pitcherSliderRate: 0.20,
    pitcherChangeupRate: 0.15,
    pitcherCurveballRate: 0.25,
    pitcherCutterRate: 0,
    pitcherSinkerRate: 0,
    hitterXslgVsFastball: 0.380,
    hitterXslgVsSlider: 0.320,
    hitterXslgVsChangeup: 0.350,
    hitterXslgVsCurveball: 0.300,
    hitterXslgVsCutter: 0.360,
    hitterXslgVsSinker: 0.380,
  },

  handedness: {
    hitterIsoVsHand: 0.090,
    hitterOverallIso: 0.110,
    pitcherHrAllowedVsHand: 0.65,
  },

  parkWeather: {
    parkHrFactor: 95,           // Pitcher's park (Sea)
    temperatureF: 65,
    windMph: 6,
    windDirection: "in",
    precipitation: false,
  },

  lineup: {
    lineupSpot: 8,
    lineupConfirmed: false,
    pinchHitRisk: true,
  },

  bullpen: {
    bullpenHr9: 0.90,
    bullpenBarrelAllowed: 0.060,
    bullpenFatigue: 0.1,
    starterExpectedInnings: 6.5,
  },

  strikeoutPenalty: {
    batterKRate: 0.30,
    pitcherKRate: 0.24,
  },

  confidence: {
    lineupConfirmed: false,
    recentSampleSize: "small",
    weatherUncertainty: false,
    pinchHitRisk: true,
    injuryOrRestRisk: false,
    dataQuality: "partial",
  },
};

/**
 * Helper: generate a slate of mock inputs for an entire game.
 */
export function mockSlateForGame(gameId: string): HrEngineInputs[] {
  if (gameId === "745812") {
    return [AARON_JUDGE_INPUTS, JUAN_SOTO_INPUTS];
  }
  return [WEAK_HITTER_INPUTS];
}
