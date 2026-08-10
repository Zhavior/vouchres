import type { ConfidenceLabel, DataQualityLabel, RecommendationStatus } from "./types";
import { HR_MASTER_MODEL } from "./modelConfig";
import type { OddsOutput } from "./types";

export function classifyRecommendation(args: {
  data_quality_label: DataQualityLabel;
  confidence: ConfidenceLabel;
  expected_value: number;
  starter_ok: boolean;
  market_fresh: boolean;
  decimal_odds: number;
  minimum_playable_decimal: number;
  p_model: number;
}): { status: RecommendationStatus; reason: string } {
  const {
    data_quality_label,
    confidence,
    expected_value,
    starter_ok,
    market_fresh,
    decimal_odds,
    minimum_playable_decimal,
    p_model,
  } = args;

  if (data_quality_label === "INVALID") {
    return { status: "NO ACTION", reason: "DATA INSUFFICIENT" };
  }
  if (!starter_ok) {
    return { status: "NO ACTION", reason: "Batter projected not to start" };
  }
  if (!market_fresh) {
    return { status: "NO ACTION", reason: "Market timestamp stale" };
  }
  if (confidence === "LOW" && expected_value <= HR_MASTER_MODEL.ev_playable_threshold + 0.02) {
    return { status: "NO ACTION", reason: "Low confidence without structural edge buffer" };
  }

  const evPlayable = expected_value > HR_MASTER_MODEL.ev_playable_threshold;
  const pricePlayable = decimal_odds >= minimum_playable_decimal;
  const confidenceOk = confidence === "HIGH" || (confidence === "MEDIUM" && evPlayable);

  if (evPlayable && confidenceOk && pricePlayable) {
    return {
      status: "VOUCHEDGE VERIFIED +EV TARGET",
      reason: `EV ${(expected_value * 100).toFixed(1)}% exceeds threshold; price meets minimum playable.`,
    };
  }

  if (p_model >= 0.10 && !pricePlayable && expected_value > 0) {
    return {
      status: "WATCH PRICE",
      reason: `Model HR prob ${(p_model * 100).toFixed(1)}% — market not yet at minimum playable decimal ${minimum_playable_decimal.toFixed(2)}.`,
    };
  }

  if (p_model >= 0.08 && expected_value <= 0) {
    return {
      status: "PASS (-EV)",
      reason: "Real HR chance exists but market price is too short (negative EV).",
    };
  }

  if (expected_value <= HR_MASTER_MODEL.ev_playable_threshold) {
    return {
      status: "PASS (-EV)",
      reason: `EV ${(expected_value * 100).toFixed(1)}% below playable threshold.`,
    };
  }

  return { status: "NO ACTION", reason: "Edge or confidence insufficient for actionable recommendation." };
}

export function marketDisciplineNote(args: {
  batter_name: string;
  p_model: number;
  expected_value: number;
  minimum_playable_american: number;
  status: RecommendationStatus;
}): string | null {
  if (args.status !== "PASS (-EV)") return null;
  if (args.p_model < 0.10) return null;
  return (
    `${args.batter_name}: strong HR probability (${(args.p_model * 100).toFixed(1)}%) but PASS (-EV) — ` +
    `market too short. Minimum playable: ${args.minimum_playable_american >= 0 ? "+" : ""}${args.minimum_playable_american}.`
  );
}

export function statusAllowsBet(status: RecommendationStatus): boolean {
  return status === "VOUCHEDGE VERIFIED +EV TARGET";
}

export function meetsMinimumPrice(odds: OddsOutput, decimal_odds: number): boolean {
  return decimal_odds >= odds.minimum_playable_decimal;
}
