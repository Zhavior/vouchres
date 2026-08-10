import type {
  BatterEvaluation,
  FeatureBreakdown,
  FeatureVector,
  GameEvaluationOutput,
  HrMasterSlateInput,
  HrMasterEngineResult,
  QuantitativeBreakdown,
} from "./types";
import { assertModelConfig, HR_MASTER_MODEL } from "./modelConfig";
import { computePcqi } from "./features/pcqi";
import { computeZfas } from "./features/zfas";
import { computePvm } from "./features/pvm";
import { computeEpv } from "./features/epv";
import { computeOvs } from "./features/ovs";
import { validateInputs, weatherConfidenceOk } from "./validation";
import { computeModelProbability } from "./model";
import { computeOdds } from "./oddsEngine";
import { computeConfidence } from "./confidence";
import { computeStaking } from "./staking";
import {
  classifyRecommendation,
  marketDisciplineNote,
  statusAllowsBet,
} from "./recommendation";

function buildQuantitativeBreakdown(args: {
  batter: HrMasterSlateInput["batters"][0]["batter"];
  pitcher: HrMasterSlateInput["batters"][0]["opposing_pitcher"];
  bullpen: HrMasterSlateInput["batters"][0]["opposing_bullpen"];
  environment: HrMasterSlateInput["batters"][0]["environment"];
  market: HrMasterSlateInput["batters"][0]["market"];
  featureBreakdown: FeatureBreakdown;
  odds: ReturnType<typeof computeOdds>;
  staking: ReturnType<typeof computeStaking>;
}): QuantitativeBreakdown {
  const { batter, pitcher, bullpen, environment, market, featureBreakdown, odds, staking } = args;
  return {
    power_profile: {
      form_weighted_barrel: featureBreakdown.pcqi.form_weighted_barrel as number,
      air_hard_hit: featureBreakdown.pcqi.air_hard_hit as number,
      contact_trajectory_boost: featureBreakdown.pcqi.contact_trajectory_boost as number,
      pull_air_percent: batter.rolling_30d_metrics.pull_air_percent,
      avg_launch_angle: batter.rolling_30d_metrics.avg_launch_angle,
    },
    pitch_overlap: {
      opposing_pitch_usage: pitcher.pitch_mix_usage,
      pitch_matchup_quality: featureBreakdown.zfas.pitch_matchup_quality,
      weak_pitch_sample: featureBreakdown.zfas.weak_pitch_sample,
    },
    vulnerability_layer: {
      HR_per_FB_allowed: pitcher.HR_per_FB_allowed,
      whiff_percent: pitcher.whiff_percent,
      FIP_minus_xFIP: pitcher.FIP - pitcher.xFIP,
      bullpen_fatigue_index: bullpen.bullpen_fatigue_index,
      bullpen_HR_per_FB: bullpen.bullpen_HR_per_FB,
    },
    environment_layer: {
      directional_park_factor: featureBreakdown.epv.directional_park_factor,
      temperature_boost: featureBreakdown.epv.temperature_boost,
      wind_boost: featureBreakdown.epv.wind_boost,
      roof_adjustment: featureBreakdown.epv.roof_adjustment,
    },
    market_layer: {
      fair_american_odds: odds.fair_american_odds,
      market_american_odds: market.american_odds,
      consensus_implied: market.consensus_implied_probability ?? null,
      expected_value: odds.expected_value,
      market_markup_flag: odds.market_markup_flag,
      edge_statement: `Model ${(odds.fair_decimal_odds > 0 ? (1 / (1 / odds.fair_decimal_odds)) : 0).toFixed(3)} vs market implied ${odds.market_implied_probability.toFixed(3)}`,
    },
    audit_ledger_recommendation: {
      ...staking,
      minimum_playable_odds: odds.minimum_playable_american,
    },
  };
}

export function evaluateBatter(
  entry: HrMasterSlateInput["batters"][0],
  game: HrMasterSlateInput["game"],
): BatterEvaluation {
  const { batter, opposing_pitcher: pitcher, opposing_bullpen: bullpen, environment, market } = entry;
  const referenceDate = game.date;

  const validation = validateInputs({ game, batter, pitcher, bullpen, market });

  if (validation.data_quality_label === "INVALID") {
    return {
      batter_id: batter.batter_id,
      batter_name: batter.batter_name,
      team: batter.team,
      features: { pcqi: 0, zfas: 0, pvm: 0, epv: 0, ovs: 0 },
      feature_breakdown: { pcqi: {}, zfas: {}, pvm: {}, epv: {}, ovs: {} },
      hr_probability: 0,
      odds: {
        fair_decimal_odds: 0,
        fair_american_odds: 0,
        market_american_odds: market.american_odds ?? 0,
        market_decimal_odds: market.decimal_odds ?? 0,
        market_implied_probability: 0,
        expected_value: 0,
        edge_vs_consensus: null,
        minimum_playable_decimal: 0,
        minimum_playable_american: 0,
        market_markup_flag: false,
      },
      confidence: "LOW",
      status: "NO ACTION",
      status_reason: "DATA INSUFFICIENT",
      audit_ledger: {
        model_version: HR_MASTER_MODEL.model_version,
        training_window: HR_MASTER_MODEL.training_window,
        calibration_method: HR_MASTER_MODEL.calibration_method,
        last_validation_date: HR_MASTER_MODEL.last_validation_date,
        feature_normalization_version: HR_MASTER_MODEL.feature_normalization_version,
        logit_hr: 0,
        p_raw: 0,
        p_calibrated: 0,
        p_model: 0,
        data_quality_label: "INVALID",
        missing_fields: validation.missing_fields,
        validation_notes: validation.validation_notes,
        confidence_inputs: {},
      },
    };
  }

  const pcqi = computePcqi(batter, referenceDate);
  const zfas = computeZfas(batter, pitcher);
  const pvm = computePvm(pitcher, bullpen);
  const epv = computeEpv(batter, environment, game);
  const ovs = computeOvs(batter, game);

  const features: FeatureVector = {
    pcqi: pcqi.normalized,
    zfas: zfas.normalized,
    pvm: pvm.normalized,
    epv: epv.normalized,
    ovs: ovs.normalized,
  };

  const featureBreakdown: FeatureBreakdown = {
    pcqi: pcqi.breakdown,
    zfas: zfas.breakdown,
    pvm: pvm.breakdown,
    epv: epv.breakdown,
    ovs: ovs.breakdown,
  };

  const model = computeModelProbability(features);
  const odds = computeOdds({
    p_model: model.p_model,
    decimal_odds: market.decimal_odds,
    american_odds: market.american_odds,
    consensus_implied_probability: market.consensus_implied_probability,
  });

  const { confidence, inputs: confidenceInputs } = computeConfidence({
    validation,
    data_quality_label: validation.data_quality_label,
    weather_confidence: environment.weather_confidence,
    roof_status: game.roof_status,
  });

  const { status, reason } = classifyRecommendation({
    data_quality_label: validation.data_quality_label,
    confidence,
    expected_value: odds.expected_value,
    starter_ok: validation.starter_ok,
    market_fresh: validation.market_fresh,
    decimal_odds: market.decimal_odds,
    minimum_playable_decimal: odds.minimum_playable_decimal,
    p_model: model.p_model,
  });

  const staking = computeStaking({
    p_model: model.p_model,
    decimal_odds: market.decimal_odds,
    confidence,
    expected_value: odds.expected_value,
    statusAllowsBet: statusAllowsBet(status),
  });

  const evaluation: BatterEvaluation = {
    batter_id: batter.batter_id,
    batter_name: batter.batter_name,
    team: batter.team,
    features,
    feature_breakdown: featureBreakdown,
    hr_probability: model.p_model,
    odds,
    confidence,
    status,
    status_reason: reason,
    audit_ledger: {
      model_version: HR_MASTER_MODEL.model_version,
      training_window: HR_MASTER_MODEL.training_window,
      calibration_method: HR_MASTER_MODEL.calibration_method,
      last_validation_date: HR_MASTER_MODEL.last_validation_date,
      feature_normalization_version: HR_MASTER_MODEL.feature_normalization_version,
      logit_hr: model.logit_hr,
      p_raw: model.p_raw,
      p_calibrated: model.p_calibrated,
      p_model: model.p_model,
      data_quality_label: validation.data_quality_label,
      missing_fields: validation.missing_fields,
      validation_notes: validation.validation_notes,
      confidence_inputs: confidenceInputs,
    },
  };

  if (status === "VOUCHEDGE VERIFIED +EV TARGET") {
    evaluation.quantitative_breakdown = buildQuantitativeBreakdown({
      batter,
      pitcher,
      bullpen,
      environment,
      market,
      featureBreakdown,
      odds,
      staking,
    });
  }

  return evaluation;
}

export function evaluateSlate(input: HrMasterSlateInput): GameEvaluationOutput {
  const matrix = input.batters.map((entry) => evaluateBatter(entry, input.game));
  matrix.sort((a, b) => b.hr_probability - a.hr_probability);

  const marketNotes = matrix
    .map((row) =>
      marketDisciplineNote({
        batter_name: row.batter_name,
        p_model: row.hr_probability,
        expected_value: row.odds.expected_value,
        minimum_playable_american: row.odds.minimum_playable_american,
        status: row.status,
      }),
    )
    .filter((n): n is string => n != null);

  const weatherOk = input.batters.every((b) =>
    weatherConfidenceOk(b.environment.weather_confidence, input.game.roof_status),
  );
  const marketFresh = input.batters.every((b) => {
    const age = (Date.now() - new Date(b.market.market_timestamp).getTime()) / 3600000;
    return Number.isFinite(age) && age <= HR_MASTER_MODEL.validation_thresholds.market_stale_hours;
  });

  const qualityCounts = matrix.reduce(
    (acc, row) => {
      acc[row.audit_ledger.data_quality_label] = (acc[row.audit_ledger.data_quality_label] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    game_id: input.game.game_id,
    matchup: `${input.game.away_team} @ ${input.game.home_team}`,
    away_team: input.game.away_team,
    home_team: input.game.home_team,
    starting_pitchers: {
      away: input.batters.find((b) => b.batter.team === input.game.away_team)?.opposing_pitcher.pitcher_name ?? "TBD",
      home: input.batters.find((b) => b.batter.team === input.game.home_team)?.opposing_pitcher.pitcher_name ?? "TBD",
    },
    matrix,
    market_discipline_notes: marketNotes,
    integrity_block: {
      model_version: HR_MASTER_MODEL.model_version,
      calibration_method: HR_MASTER_MODEL.calibration_method,
      data_quality_summary: JSON.stringify(qualityCounts),
      lineup_status: input.game.confirmed_lineups_status,
      weather_status: weatherOk ? "ok" : "degraded",
      market_timestamp_status: marketFresh ? "fresh" : "stale",
    },
  };
}

export function runHrMasterEngine(slates: HrMasterSlateInput[]): HrMasterEngineResult {
  const configCheck = assertModelConfig();
  if (configCheck.ok === false) {
    return {
      status: configCheck.reason,
      games: [],
      generated_at: new Date().toISOString(),
      error: configCheck.reason,
    };
  }

  try {
    const games = slates.map(evaluateSlate);
    return {
      status: "ready",
      games,
      generated_at: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "error",
      games: [],
      generated_at: new Date().toISOString(),
      error: (error as Error).message,
    };
  }
}
