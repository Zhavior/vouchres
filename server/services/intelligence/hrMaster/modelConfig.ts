/**
 * Active VouchEdge HR Master model coefficients and calibration metadata.
 * Halts pricing if either block is absent (enforced in engine.ts).
 */

export const HR_MASTER_MODEL = {
  model_version: "ve-hr-master-v1.0.0",
  training_window: "2023-2025 MLB regular season",
  calibration_method: "bucket_isotonic_v1",
  last_validation_date: "2026-07-22",
  feature_normalization_version: "fn-v1.0.0",
  coefficient_set: {
    intercept: -3.85,
    w_pcqi: 1.42,
    w_zfas: 1.18,
    w_pvm: 0.96,
    w_epv: 0.64,
    w_ovs: 0.88,
  },
  probability_bounds: { min: 0.03, max: 0.40 },
  ev_playable_threshold: 0.03,
  edge_safety_buffer: 0.03,
  kelly_multiplier: 0.25,
  max_unit_recommendation: 1.0,
  /** Bucket calibration: raw probability upper bound → calibrated probability */
  calibration_buckets: [
    { raw_max: 0.05, calibrated: 0.035 },
    { raw_max: 0.08, calibrated: 0.055 },
    { raw_max: 0.12, calibrated: 0.082 },
    { raw_max: 0.16, calibrated: 0.108 },
    { raw_max: 0.20, calibrated: 0.135 },
    { raw_max: 0.25, calibrated: 0.168 },
    { raw_max: 0.30, calibrated: 0.205 },
    { raw_max: 0.35, calibrated: 0.245 },
    { raw_max: 0.40, calibrated: 0.285 },
    { raw_max: 0.50, calibrated: 0.330 },
    { raw_max: 1.0, calibrated: 0.380 },
  ] as const,
  validation_thresholds: {
    starter_probability_min: 0.75,
    weather_confidence_min: 0.5,
    market_stale_hours: 4,
    pitch_sample_min: 25,
    bullpen_relievers_min: 3,
  },
  league_baselines: {
    barrel_rate: 0.085,
    air_hard_hit_rate: 0.12,
    xwOBAcon: 0.380,
    HR_per_FB: 0.125,
    whiff_percent: 0.24,
    barrel_allowed: 0.075,
    fly_ball_allowed: 0.35,
    xSLG_allowed: 0.420,
    bullpen_xFIP: 4.10,
    bullpen_HR_per_FB: 0.11,
    platoon_pa: 4.0,
    lineup_spot_pa: { 1: 4.6, 2: 4.5, 3: 4.4, 4: 4.3, 5: 4.1, 6: 3.9, 7: 3.7, 8: 3.5, 9: 3.3 },
  },
} as const;

export function assertModelConfig(): { ok: true } | { ok: false; reason: "MODEL CONFIG MISSING" | "CALIBRATION MISSING" } {
  const m = HR_MASTER_MODEL;
  if (!m.coefficient_set || m.coefficient_set.intercept == null) {
    return { ok: false, reason: "MODEL CONFIG MISSING" };
  }
  if (!m.calibration_buckets?.length || !m.calibration_method) {
    return { ok: false, reason: "CALIBRATION MISSING" };
  }
  return { ok: true };
}
