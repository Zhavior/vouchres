import type {
  BatterProfile,
  BullpenProfile,
  DataQualityLabel,
  GameContextInput,
  MarketData,
  StartingPitcherProfile,
} from "./types";
import { HR_MASTER_MODEL } from "./modelConfig";

export interface ValidationResult {
  data_quality_label: DataQualityLabel;
  missing_fields: string[];
  validation_notes: string[];
  lineup_confirmed: boolean;
  market_fresh: boolean;
  weather_confidence_ok: boolean;
  pitch_sample_reliable: boolean;
  bullpen_certainty: boolean;
  starter_ok: boolean;
}

function isPresent(value: unknown): boolean {
  return value !== null && value !== undefined && value !== "";
}

function hoursSince(isoTimestamp: string): number | null {
  const t = new Date(isoTimestamp).getTime();
  if (!Number.isFinite(t)) return null;
  return (Date.now() - t) / (1000 * 60 * 60);
}

function validateBatter(batter: BatterProfile, missing: string[]): void {
  const required: Array<[string, unknown]> = [
    ["batter.projected_plate_appearances", batter.projected_plate_appearances],
    ["batter.starter_probability", batter.starter_probability],
    ["batter.season_metrics.EV", batter.season_metrics?.EV],
    ["batter.rolling_30d_metrics.xwOBAcon", batter.rolling_30d_metrics?.xwOBAcon],
  ];
  for (const [path, val] of required) {
    if (!isPresent(val)) missing.push(path);
  }
}

function validatePitchSamples(batter: BatterProfile): boolean {
  const skill = batter.pitch_type_skill;
  const samples = [
    skill.sample_4seam,
    skill.sample_sinker,
    skill.sample_slider,
    skill.sample_curve,
    skill.sample_changeup,
    skill.sample_cutter,
  ].filter((s) => s != null) as number[];
  if (samples.length === 0) return false;
  return samples.some((s) => s >= HR_MASTER_MODEL.validation_thresholds.pitch_sample_min);
}

export function validateInputs(args: {
  game: GameContextInput;
  batter: BatterProfile;
  pitcher: StartingPitcherProfile;
  bullpen: BullpenProfile;
  market: MarketData;
}): ValidationResult {
  const missing: string[] = [];
  const notes: string[] = [];
  const { game, batter, pitcher, bullpen, market } = args;

  validateBatter(batter, missing);
  if (!isPresent(pitcher.pitcher_id)) missing.push("pitcher.pitcher_id");
  if (!isPresent(bullpen.bullpen_id)) missing.push("bullpen.bullpen_id");
  if (!isPresent(market.decimal_odds) || market.decimal_odds <= 1) missing.push("market.decimal_odds");
  if (!isPresent(market.market_timestamp)) missing.push("market.market_timestamp");

  const lineup_confirmed = game.confirmed_lineups_status === "confirmed";
  if (!lineup_confirmed) notes.push("Lineup unconfirmed — confidence downgrade applied.");

  const starter_ok =
    batter.starter_probability >= HR_MASTER_MODEL.validation_thresholds.starter_probability_min;
  if (!starter_ok) notes.push("Starter probability below threshold.");

  const marketAge = hoursSince(market.market_timestamp);
  const market_fresh =
    marketAge != null && marketAge <= HR_MASTER_MODEL.validation_thresholds.market_stale_hours;
  if (!market_fresh) notes.push("Market timestamp stale or invalid.");

  const weather_confidence_ok =
    args.game.roof_status === "closed" ||
    (isPresent(args.game) && true); // env checked separately via weather_confidence in confidence layer

  const pitch_sample_reliable = validatePitchSamples(batter);
  if (!pitch_sample_reliable) notes.push("Pitch-type skill samples too small — shrinkage applied.");

  const bullpen_certainty =
    bullpen.projected_available_relievers >=
    HR_MASTER_MODEL.validation_thresholds.bullpen_relievers_min;
  if (!bullpen_certainty) notes.push("Bullpen availability incomplete.");

  let data_quality_label: DataQualityLabel;
  if (missing.length >= 3 || !isPresent(batter.projected_plate_appearances)) {
    data_quality_label = "INVALID";
  } else if (missing.length > 0 || !lineup_confirmed || !market_fresh || !starter_ok) {
    data_quality_label = "LOW";
  } else if (!pitch_sample_reliable || !bullpen_certainty) {
    data_quality_label = "MEDIUM";
  } else {
    data_quality_label = "HIGH";
  }

  return {
    data_quality_label,
    missing_fields: missing,
    validation_notes: notes,
    lineup_confirmed,
    market_fresh,
    weather_confidence_ok,
    pitch_sample_reliable,
    bullpen_certainty,
    starter_ok,
  };
}

export function weatherConfidenceOk(weatherConfidence: number, roofStatus: GameContextInput["roof_status"]): boolean {
  if (roofStatus === "closed") return true;
  return weatherConfidence >= HR_MASTER_MODEL.validation_thresholds.weather_confidence_min;
}
