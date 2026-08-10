/** VouchEdge Master HR Intelligence — input/output contracts. */

export type DataQualityLabel = "HIGH" | "MEDIUM" | "LOW" | "INVALID";
export type ConfidenceLabel = "HIGH" | "MEDIUM" | "LOW";
export type RecommendationStatus =
  | "VOUCHEDGE VERIFIED +EV TARGET"
  | "WATCH PRICE"
  | "PASS (-EV)"
  | "NO ACTION";

export type Handedness = "L" | "R" | "S";
export type RoofStatus = "open" | "closed" | "retractable" | "unknown";

export interface SeasonMetrics {
  EV: number;
  FB_percent: number;
  HH_percent: number;
  Barrel_percent: number;
  xwOBAcon: number;
  pull_air_percent: number;
  avg_launch_angle: number;
  sweet_spot_percent: number;
}

export interface Rolling30dMetrics {
  EV: number;
  FB_percent: number;
  HH_percent: number;
  Barrel_percent: number;
  xwOBAcon: number;
  pull_air_percent: number;
  avg_launch_angle: number;
  air_hard_hit_rate: number;
}

export interface BbeLogEntry {
  event_date: string;
  launch_angle: number;
  exit_velocity: number;
  barrel_flag: boolean;
  spray_direction: "pull" | "center" | "oppo";
}

export interface PitchTypeSkill {
  xwOBA_vs_4seam?: number;
  xwOBA_vs_sinker?: number;
  xwOBA_vs_cutter?: number;
  xwOBA_vs_slider?: number;
  xwOBA_vs_curve?: number;
  xwOBA_vs_changeup?: number;
  sample_4seam?: number;
  sample_sinker?: number;
  sample_cutter?: number;
  sample_slider?: number;
  sample_curve?: number;
  sample_changeup?: number;
}

export interface SplitProfile {
  platoon_split_delta: number;
  pull_side_hr_fit: number;
}

export interface BatterProfile {
  batter_id: number;
  batter_name: string;
  team: string;
  handedness: Handedness;
  projected_lineup_spot: number;
  projected_plate_appearances: number;
  starter_probability: number;
  season_metrics: SeasonMetrics;
  rolling_30d_metrics: Rolling30dMetrics;
  rolling_14d_bbe_log: BbeLogEntry[];
  pitch_type_skill: PitchTypeSkill;
  split_profile: SplitProfile;
}

export interface PitchMixUsage {
  four_seam: number;
  sinker: number;
  cutter: number;
  slider: number;
  curve: number;
  changeup: number;
}

export interface StartingPitcherProfile {
  pitcher_id: number;
  pitcher_name: string;
  handedness: Handedness;
  projected_innings: number;
  pitch_mix_usage: PitchMixUsage;
  swinging_strike_percent: number;
  whiff_percent: number;
  HR_per_FB_allowed: number;
  barrel_percent_allowed: number;
  fly_ball_percent_allowed: number;
  xSLG_allowed: number;
  FIP: number;
  xFIP: number;
  recent_pitch_mix_change?: number;
  recent_velocity_change?: number;
  times_through_order_expectation?: number;
}

export interface BullpenProfile {
  bullpen_id: string;
  last_3_days_pitch_count: number;
  last_2_days_high_leverage_usage: number;
  projected_available_relievers: number;
  bullpen_HR_per_FB: number;
  bullpen_xFIP: number;
  bullpen_barrel_percent_allowed: number;
  bullpen_fatigue_index: number;
}

export interface EnvironmentInput {
  temperature: number;
  humidity: number;
  wind_speed: number;
  wind_direction: string;
  wind_vector_outbound_mph: number;
  park_factor_hr_overall: number;
  park_factor_pull_left: number;
  park_factor_pull_right: number;
  park_factor_center: number;
  weather_confidence: number;
}

export interface MarketData {
  sportsbook_name: string;
  market_timestamp: string;
  american_odds: number;
  decimal_odds: number;
  implied_probability_raw: number;
  best_available_price_flag: boolean;
  market_limit_quality: number;
  consensus_price?: number;
  consensus_implied_probability?: number;
}

export interface GameContextInput {
  game_id: string;
  date: string;
  away_team: string;
  home_team: string;
  ballpark: string;
  roof_status: RoofStatus;
  game_time_local: string;
  implied_team_totals: { away: number; home: number };
  confirmed_lineups_status: "confirmed" | "projected" | "unknown";
}

export interface HrMasterSlateInput {
  game: GameContextInput;
  batters: Array<{
    batter: BatterProfile;
    opposing_pitcher: StartingPitcherProfile;
    opposing_bullpen: BullpenProfile;
    environment: EnvironmentInput;
    market: MarketData;
  }>;
}

export interface FeatureVector {
  pcqi: number;
  zfas: number;
  pvm: number;
  epv: number;
  ovs: number;
}

export interface FeatureBreakdown {
  pcqi: Record<string, number>;
  zfas: Record<string, number | string | boolean>;
  pvm: Record<string, number>;
  epv: Record<string, number | string>;
  ovs: Record<string, number>;
}

export interface OddsOutput {
  fair_decimal_odds: number;
  fair_american_odds: number;
  market_american_odds: number;
  market_decimal_odds: number;
  market_implied_probability: number;
  expected_value: number;
  edge_vs_consensus: number | null;
  minimum_playable_decimal: number;
  minimum_playable_american: number;
  market_markup_flag: boolean;
}

export interface StakingOutput {
  raw_fractional_kelly: number;
  risk_adjusted_fractional_kelly: number;
  unit_recommendation: number;
}

export interface AuditLedger {
  model_version: string;
  training_window: string;
  calibration_method: string;
  last_validation_date: string;
  feature_normalization_version: string;
  logit_hr: number;
  p_raw: number;
  p_calibrated: number;
  p_model: number;
  data_quality_label: DataQualityLabel;
  missing_fields: string[];
  validation_notes: string[];
  confidence_inputs: Record<string, string | number | boolean>;
}

export interface QuantitativeBreakdown {
  power_profile: Record<string, number | string>;
  pitch_overlap: Record<string, unknown>;
  vulnerability_layer: Record<string, number | string>;
  environment_layer: Record<string, number | string>;
  market_layer: Record<string, number | string | boolean>;
  audit_ledger_recommendation: StakingOutput & {
    minimum_playable_odds: number;
  };
}

export interface BatterEvaluation {
  batter_id: number;
  batter_name: string;
  team: string;
  features: FeatureVector;
  feature_breakdown: FeatureBreakdown;
  hr_probability: number;
  odds: OddsOutput;
  confidence: ConfidenceLabel;
  status: RecommendationStatus;
  status_reason: string;
  quantitative_breakdown?: QuantitativeBreakdown;
  audit_ledger: AuditLedger;
}

export interface GameEvaluationOutput {
  game_id: string;
  matchup: string;
  away_team: string;
  home_team: string;
  starting_pitchers: { away: string; home: string };
  matrix: BatterEvaluation[];
  market_discipline_notes: string[];
  integrity_block: {
    model_version: string;
    calibration_method: string;
    data_quality_summary: string;
    lineup_status: string;
    weather_status: string;
    market_timestamp_status: string;
  };
}

export interface HrMasterEngineResult {
  status: "ready" | "MODEL CONFIG MISSING" | "CALIBRATION MISSING" | "error";
  games: GameEvaluationOutput[];
  generated_at: string;
  error?: string;
}
