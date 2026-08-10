import type { ConfidenceLabel, DataQualityLabel } from "./types";
import type { ValidationResult } from "./validation";
import { weatherConfidenceOk } from "./validation";

export function computeConfidence(args: {
  validation: ValidationResult;
  data_quality_label: DataQualityLabel;
  weather_confidence: number;
  roof_status: "open" | "closed" | "retractable" | "unknown";
}): { confidence: ConfidenceLabel; inputs: Record<string, string | number | boolean> } {
  const { validation, data_quality_label, weather_confidence, roof_status } = args;

  let tier: ConfidenceLabel =
    data_quality_label === "HIGH"
      ? "HIGH"
      : data_quality_label === "MEDIUM"
        ? "MEDIUM"
        : "LOW";

  const downgradeReasons: string[] = [];

  if (!validation.lineup_confirmed) {
    tier = downgradeTier(tier);
    downgradeReasons.push("lineup_unconfirmed");
  }
  if (!validation.starter_ok) {
    tier = downgradeTier(tier);
    downgradeReasons.push("starter_probability_low");
  }
  if (!validation.market_fresh) {
    tier = downgradeTier(tier);
    downgradeReasons.push("stale_odds");
  }
  if (!weatherConfidenceOk(weather_confidence, roof_status)) {
    tier = downgradeTier(tier);
    downgradeReasons.push("weather_confidence_low");
  }
  if (!validation.pitch_sample_reliable) {
    tier = downgradeTier(tier);
    downgradeReasons.push("pitch_sample_weak");
  }

  if (data_quality_label === "INVALID") tier = "LOW";

  return {
    confidence: tier,
    inputs: {
      data_quality_label,
      lineup_confirmed: validation.lineup_confirmed,
      starter_ok: validation.starter_ok,
      market_fresh: validation.market_fresh,
      weather_confidence,
      pitch_sample_reliable: validation.pitch_sample_reliable,
      bullpen_certainty: validation.bullpen_certainty,
      downgrade_reasons: downgradeReasons.join(", ") || "none",
    },
  };
}

function downgradeTier(current: ConfidenceLabel): ConfidenceLabel {
  if (current === "HIGH") return "MEDIUM";
  return "LOW";
}
