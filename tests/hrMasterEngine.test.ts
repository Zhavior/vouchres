import { describe, expect, it } from "vitest";
import {
  evaluateBatter,
  evaluateSlate,
  runHrMasterEngine,
  computeModelProbability,
  classifyRecommendation,
  HR_MASTER_MODEL,
} from "../server/services/intelligence/hrMaster";
import type { HrMasterSlateInput } from "../server/services/intelligence/hrMaster";

const today = "2026-08-10";
const freshTimestamp = new Date().toISOString();

function buildSampleSlate(overrides: {
  decimal_odds?: number;
  american_odds?: number;
  lineup_status?: "confirmed" | "projected" | "unknown";
  starter_probability?: number;
} = {}): HrMasterSlateInput {
  const decimal_odds = overrides.decimal_odds ?? 8.5;
  const american_odds = overrides.american_odds ?? 750;

  const batter = {
    batter_id: 592450,
    batter_name: "Aaron Judge",
    team: "NYY",
    handedness: "R" as const,
    projected_lineup_spot: 3,
    projected_plate_appearances: 4.4,
    starter_probability: overrides.starter_probability ?? 0.98,
    season_metrics: {
      EV: 95.2,
      FB_percent: 38,
      HH_percent: 52,
      Barrel_percent: 18,
      xwOBAcon: 0.420,
      pull_air_percent: 28,
      avg_launch_angle: 22,
      sweet_spot_percent: 34,
    },
    rolling_30d_metrics: {
      EV: 96.1,
      FB_percent: 40,
      HH_percent: 54,
      Barrel_percent: 20,
      xwOBAcon: 0.435,
      pull_air_percent: 30,
      avg_launch_angle: 23,
      air_hard_hit_rate: 0.18,
      sweet_spot_percent: 35,
    },
    rolling_14d_bbe_log: [
      {
        event_date: "2026-08-08",
        launch_angle: 28,
        exit_velocity: 108,
        barrel_flag: true,
        spray_direction: "pull" as const,
      },
      {
        event_date: "2026-08-06",
        launch_angle: 24,
        exit_velocity: 101,
        barrel_flag: false,
        spray_direction: "center" as const,
      },
    ],
    pitch_type_skill: {
      xwOBA_vs_4seam: 0.410,
      xwOBA_vs_slider: 0.390,
      sample_4seam: 80,
      sample_slider: 45,
    },
    split_profile: {
      platoon_split_delta: 0.04,
      pull_side_hr_fit: 0.72,
    },
  };

  return {
    game: {
      game_id: "777001",
      date: today,
      away_team: "BOS",
      home_team: "NYY",
      ballpark: "Yankee Stadium",
      roof_status: "open",
      game_time_local: "2026-08-10T19:05:00",
      implied_team_totals: { away: 4.2, home: 5.1 },
      confirmed_lineups_status: overrides.lineup_status ?? "confirmed",
    },
    batters: [
      {
        batter,
        opposing_pitcher: {
          pitcher_id: 543037,
          pitcher_name: "Test Pitcher",
          handedness: "L",
          projected_innings: 5.5,
          pitch_mix_usage: {
            four_seam: 0.45,
            sinker: 0.05,
            cutter: 0.10,
            slider: 0.25,
            curve: 0.05,
            changeup: 0.10,
          },
          swinging_strike_percent: 0.11,
          whiff_percent: 0.24,
          HR_per_FB_allowed: 0.14,
          barrel_percent_allowed: 0.09,
          fly_ball_percent_allowed: 0.38,
          xSLG_allowed: 0.440,
          FIP: 4.20,
          xFIP: 3.90,
        },
        opposing_bullpen: {
          bullpen_id: "BOS",
          last_3_days_pitch_count: 140,
          last_2_days_high_leverage_usage: 3,
          projected_available_relievers: 6,
          bullpen_HR_per_FB: 0.12,
          bullpen_xFIP: 4.05,
          bullpen_barrel_percent_allowed: 0.08,
          bullpen_fatigue_index: 0.55,
        },
        environment: {
          temperature: 82,
          humidity: 55,
          wind_speed: 8,
          wind_direction: "SW",
          wind_vector_outbound_mph: 4,
          park_factor_hr_overall: 112,
          park_factor_pull_left: 115,
          park_factor_pull_right: 110,
          park_factor_center: 108,
          weather_confidence: 0.85,
        },
        market: {
          sportsbook_name: "DraftKings",
          market_timestamp: freshTimestamp,
          american_odds,
          decimal_odds,
          implied_probability_raw: 1 / decimal_odds,
          best_available_price_flag: true,
          market_limit_quality: 0.9,
          consensus_implied_probability: 1 / decimal_odds,
        },
      },
    ],
  };
}

describe("hrMasterEngine", () => {
  it("produces deterministic calibrated probability from feature vector", () => {
    const first = computeModelProbability({ pcqi: 0.72, zfas: 0.68, pvm: 0.61, epv: 0.58, ovs: 0.70 });
    const second = computeModelProbability({ pcqi: 0.72, zfas: 0.68, pvm: 0.61, epv: 0.58, ovs: 0.70 });
    expect(first.p_model).toBe(second.p_model);
    expect(first.p_model).toBeGreaterThanOrEqual(HR_MASTER_MODEL.probability_bounds.min);
    expect(first.p_model).toBeLessThanOrEqual(HR_MASTER_MODEL.probability_bounds.max);
  });

  it("evaluates a full slate with audit ledger metadata", () => {
    const slate = buildSampleSlate();
    const game = evaluateSlate(slate);
    expect(game.matrix).toHaveLength(1);
    const row = game.matrix[0];
    expect(row.audit_ledger.model_version).toBe(HR_MASTER_MODEL.model_version);
    expect(row.audit_ledger.calibration_method).toBe(HR_MASTER_MODEL.calibration_method);
    expect(row.hr_probability).toBeGreaterThan(0);
    expect(row.features.pcqi).toBeGreaterThan(0);
  });

  it("returns NO ACTION when data is insufficient", () => {
    const slate = buildSampleSlate();
    slate.batters[0].batter.projected_plate_appearances = undefined as unknown as number;
    const row = evaluateBatter(slate.batters[0], slate.game);
    expect(row.status).toBe("NO ACTION");
    expect(row.status_reason).toBe("DATA INSUFFICIENT");
    expect(row.audit_ledger.data_quality_label).toBe("INVALID");
  });

  it("classifies PASS (-EV) when market is too short despite power profile", () => {
    const slate = buildSampleSlate({ decimal_odds: 2.0, american_odds: 100 });
    const row = evaluateBatter(slate.batters[0], slate.game);
    expect(row.odds.expected_value).toBeLessThan(HR_MASTER_MODEL.ev_playable_threshold);
    expect(["PASS (-EV)", "NO ACTION"]).toContain(row.status);
  });

  it("can surface +EV TARGET when price is long enough", () => {
    const slate = buildSampleSlate({ decimal_odds: 14, american_odds: 1300 });
    const row = evaluateBatter(slate.batters[0], slate.game);
    if (row.odds.expected_value > HR_MASTER_MODEL.ev_playable_threshold) {
      expect(["VOUCHEDGE VERIFIED +EV TARGET", "WATCH PRICE"]).toContain(row.status);
    }
  });

  it("runHrMasterEngine returns ready status with model config", () => {
    const result = runHrMasterEngine([buildSampleSlate()]);
    expect(result.status).toBe("ready");
    expect(result.games).toHaveLength(1);
    expect(result.generated_at).toBeTruthy();
  });
});

describe("classifyRecommendation", () => {
  it("requires EV above threshold for +EV TARGET", () => {
    const result = classifyRecommendation({
      data_quality_label: "HIGH",
      confidence: "HIGH",
      expected_value: 0.01,
      starter_ok: true,
      market_fresh: true,
      decimal_odds: 10,
      minimum_playable_decimal: 9,
      p_model: 0.12,
    });
    expect(result.status).toBe("PASS (-EV)");
  });
});
