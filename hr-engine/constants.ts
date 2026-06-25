/**
 * VouchEdge HR Engine — Tunable Constants
 *
 * ALL league averages, weights, and multipliers live here so the engine
 * can be calibrated against real MLB data without touching math logic.
 *
 * Update LEAGUE_AVERAGES annually based on Statcast/FG league data.
 * Update WEIGHTS if you re-balance the composite score formula.
 *
 * Calibration target:
 *   - Elite HR target (Score 90+) → 9-11% anytime HR probability
 *   - Strong HR target (Score 80-89) → 7-9%
 *   - Good HR target (Score 70-79) → 5-7%
 *   - Sneaky HR target (Score 60-69) → 3-5%
 *   - Avoid (Score <60) → <3%
 *
 * Run engine.test.ts after changes to verify calibration.
 */

export const LEAGUE_AVERAGES = {
  // Hitter stats (2024 MLB average, approx)
  iso: 0.165,
  barrelRate: 0.075,        // 7.5% of batted balls
  hardHitRate: 0.39,        // 39% of batted balls
  hrFbRate: 0.122,          // 12.2% of fly balls become HRs
  flyBallRate: 0.36,        // 36% of batted balls are fly balls
  contactRate: 0.73,        // 73% of ABs result in contact (1 - K%)
  kRate: 0.222,             // 22.2% K rate
  bbRate: 0.085,            // 8.5% BB rate

  // Pitcher stats
  pitcherHr9: 1.10,         // 1.10 HR per 9 innings
  pitcherBarrelAllowed: 0.075,
  pitcherHardHitAllowed: 0.39,
  pitcherFbAllowed: 0.36,
  pitcherKRate: 0.222,

  // Stabilizer counts (Section 12 — for regression)
  // These are the sample sizes at which a stat becomes 50% reliable
  hrFbStabilizer: 100,      // Fly balls before HR/FB stabilizes
  isoStabilizer: 300,       // At-bats before ISO stabilizes
  barrelStabilizer: 80,     // Batted balls before Barrel% stabilizes
  hardHitStabilizer: 80,
} as const;

// =========================================================
// Composite HR Score weights (Section 2)
// =========================================================
// These MUST sum to 1.0
export const HR_SCORE_WEIGHTS = {
  hitterPower: 0.25,
  barrelForm: 0.20,
  pitcherVulnerability: 0.20,
  pitchMix: 0.15,
  parkWeather: 0.10,
  lineup: 0.05,
  bullpen: 0.05,
} as const;

// Strikeout penalty is subtracted AFTER the weighted sum (not part of weights)
export const STRIKEOUT_PENALTY_WEIGHT = 1.0;  // Multiplies (K% × K%) × 100

// =========================================================
// Hitter Power Score weights (Section 3)
// =========================================================
// Must sum to 1.0
export const HITTER_POWER_WEIGHTS = {
  iso: 0.30,
  barrel: 0.30,
  hardHit: 0.20,
  hrFb: 0.20,
} as const;

// =========================================================
// Barrel Form Score weights (Section 4)
// =========================================================
// Must sum to 1.0
export const BARREL_FORM_WEIGHTS = {
  season: 0.50,
  last15: 0.30,
  last7: 0.20,
} as const;

// Small sample thresholds
export const SMALL_SAMPLE_THRESHOLD_7D = 10;     // <10 batted balls → small sample
export const SMALL_SAMPLE_CONFIDENCE_PENALTY = 0.10;  // -10% confidence

// =========================================================
// Pitcher Vulnerability Score weights (Section 5)
// =========================================================
// Must sum to 1.0
export const PITCHER_VULN_WEIGHTS = {
  hr9: 0.25,
  barrelAllowed: 0.30,
  hardHitAllowed: 0.20,
  fbAllowed: 0.15,
  commandRisk: 0.10,
} as const;

// Poor Command Score weights (within Section 5)
// Sum doesn't need to equal 1 — these are blended into "command risk"
export const COMMAND_RISK_WEIGHTS = {
  bbRate: 0.40,
  middleMiddleRate: 0.35,
  meatballRate: 0.25,
} as const;

// =========================================================
// Handedness multiplier bands (Section 7)
// =========================================================
export const HANDEDNESS_BANDS = [
  { min: 0.080, multiplier: 1.10, label: "Positive" },
  { min: 0.040, multiplier: 1.06, label: "Positive" },
  { min: -0.039, multiplier: 1.00, label: "Neutral" },
  { min: -0.080, multiplier: 0.94, label: "Negative" },
  { min: -Infinity, multiplier: 0.90, label: "Negative" },
] as const;

// =========================================================
// Park + Weather constants (Section 8)
// =========================================================
export const PARK_FACTOR_DIVISOR = 100;
export const TEMP_BASELINE_F = 70;
export const TEMP_BOOST_PER_DEGREE = 0.005;    // +0.5% per °F above 70
export const WIND_BOOST_PER_MPH = 0.01;        // +1% per MPH out
export const WIND_PENALTY_PER_MPH = 0.01;      // -1% per MPH in

// =========================================================
// Lineup multipliers (Section 9)
// =========================================================
export const LINEUP_MULTIPLIERS: Record<number, number> = {
  1: 1.08,
  2: 1.06,
  3: 1.04,
  4: 1.02,
  5: 1.00,
  6: 0.96,
  7: 0.93,
  8: 0.90,
  9: 0.88,
};

export const UNCONFIRMED_LINEUP_PENALTY = 0.85;  // Multiplier if lineup not confirmed
export const PINCH_HIT_RISK_PENALTY = 0.70;

// =========================================================
// Strikeout penalty (Section 10)
// =========================================================
// K Penalty = Batter K% × Pitcher K% (a probability of "both events occur")
// Adjusted HR Score = HR Score - (K Penalty × 100 × STRIKEOUT_PENALTY_WEIGHT)
export const K_PENALTY_THRESHOLDS = {
  low: 0.05,        // <5% K penalty → Low risk
  medium: 0.08,     // 5-8% → Medium risk
  // >8% → High risk
} as const;

// =========================================================
// Confidence multipliers (Section 11)
// =========================================================
export const CONFIDENCE_MULTIPLIERS = {
  lineupConfirmed: 1.00,
  lineupUnconfirmed: 0.85,
  largeSample: 1.00,
  mediumSample: 0.92,
  smallSample: 0.85,
  weatherCertain: 1.00,
  weatherUncertain: 0.90,
  noPinchHitRisk: 1.00,
  pinchHitRisk: 0.70,
  noInjuryRisk: 1.00,
  injuryRisk: 0.65,
  dataQualityFull: 1.00,
  dataQualityPartial: 0.92,
  dataQualityLimited: 0.80,
} as const;

// =========================================================
// HR Score tier thresholds (Section 2)
// =========================================================
export const TIER_THRESHOLDS = {
  elite: 90,
  strong: 80,
  good: 70,
  sneaky: 60,
  // below 60 = Avoid
} as const;

// =========================================================
// Parlay risk tiers (Section 15)
// =========================================================
export const PARLAY_RISK_TIERS = {
  single: { maxProb: 1.0, label: "Single HR: Reasonable Risk" },
  twoLeg: { maxProb: 0.02, label: "2-Leg HR Parlay: High Risk" },
  threeLeg: { maxProb: 0.005, label: "3-Leg HR Parlay: Very High Risk" },
  fourPlus: { maxProb: 0.001, label: "4+ HR Parlay: Lottery Risk" },
} as const;

// =========================================================
// Notification thresholds (Section 20)
// =========================================================
export const NOTIFICATION_THRESHOLDS = {
  hrScoreBoost: 80,         // Alert when score crosses 80
  hrScoreDrop: 60,          // Alert when score drops below 60
  minScoreDelta: 5,         // Min change to trigger alert
  windShiftMph: 8,          // Min wind shift to trigger weather alert
} as const;

// =========================================================
// Process Score weights (Section 21)
// =========================================================
export const PROCESS_SCORE_WEIGHTS = {
  preGameAccuracy: 0.35,
  contactQuality: 0.25,
  matchupLogic: 0.25,
  dataCertainty: 0.15,
} as const;

// =========================================================
// Safe language — what to say instead of "lock", "guarantee", etc.
// (Section 24)
// =========================================================
export const SAFE_LANGUAGE = {
  insteadOf: {
    "lock": "probability-supported target",
    "guaranteed": "model-supported lean",
    "free money": "high-upside HR candidate",
    "must bet": "risk-adjusted pick",
    "sure hit": "model likes this profile",
    "safe parlay": "lottery-level parlay risk",
  },
  allowed: [
    "Probability-based target",
    "Model-supported lean",
    "High-upside HR candidate",
    "Risk-adjusted pick",
    "Strong profile",
    "Edge detected",
  ],
  forbidden: [
    "lock",
    "Lock",
    "guaranteed",
    "Guaranteed",
    "free money",
    "must bet",
    "sure hit",
    "safe parlay",
    "100%",
    "can't miss",
  ],
} as const;

// =========================================================
// Disclaimer (appended to every pick, every card, every notification)
// =========================================================
export const DISCLAIMER = "Probability-based research for entertainment only. Not betting advice. Past performance does not guarantee future results.";
