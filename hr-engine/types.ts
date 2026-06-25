/**
 * VouchEdge HR Engine — Types
 *
 * The single source of truth for every HR-related data shape in the app.
 * Every page (HR Board, AI Picks, Parlay Scanner, Player Research,
 * Pitcher Lab, Game Research, Notifications, Results, Profile, Dashboard,
 * Vouch Cards) consumes these types.
 *
 * Section 26 of the engine spec.
 */

// =========================================================
// Core sub-score types (Sections 3-10)
// =========================================================

export interface HitterPowerInputs {
  iso: number;                 // Isolated Power (SLG - AVG), e.g. 0.264
  barrelRate: number;          // Barrel% per batted ball, e.g. 0.152
  hardHitRate: number;         // Hard-Hit% per batted ball, e.g. 0.52
  hrFbRate: number;            // HR per fly ball, e.g. 0.24
  // Percentiles (0-100) for each stat vs league
  isoPercentile: number;
  barrelPercentile: number;
  hardHitPercentile: number;
  hrFbPercentile: number;
}

export interface HitterPowerResult {
  score: number;               // 0-100
  iso: number;
  barrelRate: number;
  hardHitRate: number;
  hrFbRate: number;
  label: string;               // "Elite raw power", "Above-average power", etc.
}

export interface BarrelFormInputs {
  seasonBarrelRate: number;    // Full-season Barrel%
  last15BarrelRate: number;    // Last 15 days Barrel%
  last7BarrelRate: number;     // Last 7 days Barrel%
  last7HardHitRate: number;    // Last 7 days Hard-Hit%
  last15BattedBalls: number;   // Sample size for 15-day window
  last7BattedBalls: number;    // Sample size for 7-day window
}

export interface BarrelFormResult {
  score: number;               // 0-100, weighted blend
  trend: "heating_up" | "cold" | "stable" | "small_sample";
  last15BarrelRate: number;
  last7BarrelRate: number;
  last7HardHitRate: number;
  smallSampleWarning: boolean;
  label: string;               // "🔥 Heating Up", "🧊 Cold Contact", etc.
}

export interface PitcherVulnerabilityInputs {
  hr9: number;                 // HR per 9 innings
  barrelAllowed: number;       // Barrel% allowed
  hardHitAllowed: number;      // Hard-Hit% allowed
  fbAllowed: number;           // Fly-ball% allowed
  bbRate: number;              // Walk rate
  middleMiddleRate: number;    // Middle-middle pitch% (meatball rate)
  meatballRate: number;        // Defined "mistake" pitch rate
  // Percentiles vs league
  hr9Percentile: number;
  barrelAllowedPercentile: number;
  hardHitAllowedPercentile: number;
  fbAllowedPercentile: number;
}

export interface PitcherVulnerabilityResult {
  score: number;               // 0-100 (higher = more vulnerable)
  hr9: number;
  barrelAllowed: number;
  hardHitAllowed: number;
  fbAllowed: number;
  commandRisk: number;         // Composite of BB% + middle-middle + meatball
  commandRiskLabel: "Low" | "Medium" | "High";
  label: string;
}

export interface PitchMixInputs {
  // Pitcher's pitch usage rates (sum to 1.0)
  pitcherFastballRate: number;
  pitcherSliderRate: number;
  pitcherChangeupRate: number;
  pitcherCurveballRate: number;
  pitcherCutterRate: number;
  pitcherSinkerRate: number;
  // Hitter's expected SLG by pitch type
  hitterXslgVsFastball: number;
  hitterXslgVsSlider: number;
  hitterXslgVsChangeup: number;
  hitterXslgVsCurveball: number;
  hitterXslgVsCutter: number;
  hitterXslgVsSinker: number;
}

export interface PitchMixResult {
  score: number;               // 0-100
  expectedXslg: number;        // Weighted xSLG against this pitcher's mix
  bestMatchupPitch: string;    // "Fastball", "Slider", etc.
  riskPitch: string;           // Pitch type hitter struggles against most
  edge: "Positive" | "Neutral" | "Negative";
  label: string;
}

export interface HandednessInputs {
  hitterIsoVsHand: number;     // Hitter ISO vs pitcher's throwing hand
  hitterOverallIso: number;    // Hitter overall ISO
  pitcherHrAllowedVsHand: number; // Pitcher HR rate vs handedness (LHB/RHB)
}

export interface HandednessResult {
  splitEdge: number;           // ISO_vs_hand - overall_ISO
  multiplier: number;          // 0.90 to 1.10
  edge: "Positive" | "Neutral" | "Negative";
  label: string;
}

export interface ParkWeatherInputs {
  parkHrFactor: number;        // e.g. 112 = 12% more HRs than average
  temperatureF: number;        // Game-time temperature
  windMph: number;             // Wind speed (signed: + = out, - = in)
  windDirection: "out" | "in" | "cross" | "neutral";
  precipitation: boolean;
}

export interface ParkWeatherResult {
  parkMultiplier: number;      // Park HR Factor / 100
  weatherMultiplier: number;   // 1 + temp boost + wind boost
  combinedMultiplier: number;  // Park × Weather
  boost: number;               // Combined % boost (e.g., 0.175 = +17.5%)
  temperatureF: number;
  windMph: number;
  windDirection: string;
  label: string;               // "🚀 Carry Boost", "🌬️ Wind Out", etc.
}

export interface LineupInputs {
  lineupSpot: number | null;   // 1-9, or null if not confirmed
  lineupConfirmed: boolean;
  pinchHitRisk: boolean;       // True if player might be lifted for a PH
}

export interface LineupResult {
  multiplier: number;          // 0.88 to 1.08
  lineupSpot: number | null;
  confirmed: boolean;
  paBoost: number;             // % boost/cut, e.g., +6% or -12%
  label: string;
  warning: string | null;
}

export interface BullpenInputs {
  // Opposing bullpen HR weakness (for late-game PAs)
  bullpenHr9: number;          // Bullpen HR/9
  bullpenBarrelAllowed: number;
  bullpenFatigue: number;      // 0-1, how tired the bullpen is
  starterExpectedInnings: number;
}

export interface BullpenResult {
  multiplier: number;          // ~1.00-1.10
  riskLevel: "Low" | "Medium" | "High";
  label: string;
}

export interface StrikeoutPenaltyInputs {
  batterKRate: number;         // K% vs pitcher's hand
  pitcherKRate: number;        // Pitcher's overall K%
}

export interface StrikeoutPenaltyResult {
  penalty: number;             // Raw K penalty (0-1)
  adjustedScore: number;       // HR Score - penalty × 100
  riskLevel: "Low" | "Medium" | "High";
  label: string;               // "✅ Low K Risk", "⚠️ Swing-and-Miss Risk", "🚨 High K Penalty"
}

// =========================================================
// Confidence (Section 11)
// =========================================================

export interface ConfidenceInputs {
  lineupConfirmed: boolean;
  recentSampleSize: "large" | "medium" | "small";  // Based on batted balls
  weatherUncertainty: boolean;   // Rain/thunderstorm forecast
  pinchHitRisk: boolean;
  injuryOrRestRisk: boolean;
  dataQuality: "full" | "partial" | "limited";
}

export interface ConfidenceResult {
  multiplier: number;          // 0-1
  level: "High" | "Medium-High" | "Medium" | "Low" | "Lottery";
  reasons: string[];           // Why confidence is what it is
}

// =========================================================
// Tier (Section 2)
// =========================================================

export type HrTier = "Elite" | "Strong" | "Good" | "Sneaky" | "Avoid";

export interface TierResult {
  tier: HrTier;
  label: string;               // "Elite HR Target", "Strong HR Target", etc.
  description: string;
}

// =========================================================
// The full HR prediction (Section 1 + 2)
// =========================================================

export interface HrPrediction {
  // Identity
  playerId: string;
  playerName: string;
  team: string;
  opponent: string;
  pitcherName: string;
  gameId: string;

  // Top-line outputs (what users see)
  hrProbability: number;       // 0-1, e.g., 0.078 = 7.8%
  hrScore: number;             // 0-100
  confidence: ConfidenceResult;
  tier: TierResult;

  // The Poisson λ and its components
  lambda: number;              // Expected HR count in the game
  baselineLambda: number;      // Before multipliers
  multiplier: number;          // Combined multiplier

  // Sub-scores (0-100 each, for the breakdown UI)
  hitterPowerScore: HitterPowerResult;
  barrelFormScore: BarrelFormResult;
  pitcherVulnerabilityScore: PitcherVulnerabilityResult;
  pitchMixScore: PitchMixResult;
  parkWeatherScore: ParkWeatherResult;
  lineupScore: LineupResult;
  bullpenScore: BullpenResult;
  strikeoutPenalty: StrikeoutPenaltyResult;
  handednessScore: HandednessResult;

  // Multipliers used (for transparency)
  parkMultiplier: number;
  weatherMultiplier: number;
  pitchMixMultiplier: number;
  handednessMultiplier: number;
  pitcherWeaknessMultiplier: number;
  lineupMultiplier: number;
  bullpenMultiplier: number;

  // Raw inputs (for Player Research deep-dive)
  inputs: HrEngineInputs;

  // Explanation layer (Section 25)
  topReasons: string[];        // 3 reasons, e.g., "Elite barrel rate"
  risks: string[];             // 2 risks, e.g., "27% K rate vs RHP"
  modelNote: string;           // Full narrative explanation
}

// =========================================================
// The full input bundle passed to the engine
// =========================================================

export interface HrEngineInputs {
  // Identity
  playerId: string;
  playerName: string;
  team: string;
  opponent: string;
  pitcherName: string;
  gameId: string;

  // Hitter season stats
  expectedPA: number;          // Projected PA for today's game
  contactRate: number;         // 1 - K% (per AB)
  flyBallRate: number;         // FB% per batted ball
  bbRate: number;              // Walk rate
  hitterHand: "L" | "R" | "S";

  // Hitter power inputs (Section 3)
  hitterPower: HitterPowerInputs;

  // Barrel form inputs (Section 4)
  barrelForm: BarrelFormInputs;

  // Pitcher vulnerability inputs (Section 5)
  pitcherVulnerability: PitcherVulnerabilityInputs;

  // Pitch mix inputs (Section 6)
  pitchMix: PitchMixInputs;

  // Handedness inputs (Section 7)
  handedness: HandednessInputs;

  // Park + weather inputs (Section 8)
  parkWeather: ParkWeatherInputs;

  // Lineup inputs (Section 9)
  lineup: LineupInputs;

  // Bullpen inputs (Section 10 — late-game PAs)
  bullpen: BullpenInputs;

  // Strikeout penalty inputs (Section 10b)
  strikeoutPenalty: StrikeoutPenaltyInputs;

  // Confidence inputs (Section 11)
  confidence: ConfidenceInputs;
}

// =========================================================
// Parlay Scanner (Section 15)
// =========================================================

export interface ParlayLeg {
  prediction: HrPrediction;
  // Whether this leg's game overlaps with another leg's game (correlation)
  correlatedWith: string[];    // Leg IDs that share the same game
}

export interface ParlayScanResult {
  legs: ParlayLeg[];
  combinedProbability: number; // Product of individual probabilities
  combinedScore: number;       // Average of leg scores, weighted by confidence
  riskTier: "Reasonable" | "High" | "Very High" | "Lottery";
  riskLabel: string;           // "Single HR: Reasonable Risk", etc.
  correlationWarning: string | null;
  overexposureWarning: string | null;
  legQuality: "Strong" | "Mixed" | "Weak";
  explanation: string;
}

// =========================================================
// Vouch Card (Section 16)
// =========================================================

export interface VouchCardData {
  playerName: string;
  team: string;
  opponent: string;
  pickType: "HR" | "RBI" | "Run" | "Parlay";
  score: number;
  confidence: string;
  tier: string;
  topReasons: string[];
  risks: string[];
  probability: number;
  disclaimer: string;
  shareText: string;           // Plain-text version for Twitter
  cardText: string;            // Multi-line formatted for image cards
}

// =========================================================
// Notifications (Section 20)
// =========================================================

export type NotificationType =
  | "hr_boost"           // Score jumped above 80
  | "lineup_confirmed"   // Top HR candidate's lineup confirmed
  | "weather_shift"      // Wind shifted to out
  | "pitcher_change"     // Opposing pitcher changed
  | "bullpen_alert"      // Vulnerable bullpen entering
  | "pick_risk"          // User's saved pick got riskier
  | "parlay_inactive";   // Parlay leg became inactive

export interface HrNotification {
  id: string;
  type: NotificationType;
  title: string;               // "🚀 HR Boost Alert"
  body: string;                // "Juan Soto moved from 76 → 84 after lineup confirmation..."
  playerId?: string;
  gameId?: string;
  scoreBefore?: number;
  scoreAfter?: number;
  createdAt: string;
  severity: "info" | "warning" | "critical";
}

// =========================================================
// Results / Process Score (Section 21)
// =========================================================

export interface PickOutcome {
  prediction: HrPrediction;
  result: "won" | "lost" | "push" | "void";
  hrHit: boolean;
  paCount: number;
  hardHitFlyouts: number;
  lineupConfirmedAtFirstPitch: boolean;
  weatherChanged: boolean;
  pitcherChanged: boolean;
}

export interface ProcessScoreResult {
  score: number;               // 0-100, how good the PROCESS was
  label: "Good Process / Good Result" | "Good Process / Bad Result" | "Bad Process / Bad Result" | "Lucky Win";
  preGameScore: number;
  finalProbability: number;
  contactQuality: "Strong" | "Mixed" | "Weak";
  matchupLogicAccuracy: number; // 0-100
  dataCertainty: number;        // 0-100
  modelReview: string;          // Narrative
}

// =========================================================
// Profile Stats (Section 22)
// =========================================================

export interface HrProfileStats {
  totalHrPicks: number;
  hrHitRate: number;            // % of HR picks that hit
  averagePickScore: number;
  hitRateByTier: Record<HrTier, number>;
  bestTier: HrTier | null;
  worstTier: HrTier | null;
  goodProcessRate: number;      // % of picks with process score >= 70
  lotteryParlays: number;       // Count of 3+ leg HR parlays
  parlayRiskBehavior: "Conservative" | "Balanced" | "Aggressive" | "Reckless";
  roi: number;                  // ROI on HR picks (units won / units staked)
}
