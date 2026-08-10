import type {
  ConfidenceLabel,
  DataQualityLabel,
  HrEngineRequestV2,
  SlateValidationResult,
} from "../types";
import { safeNumber } from "../shared/normalize";

const STARTER_PROBABILITY_MIN = 0.5;
const MARKET_STALE_HOURS = 6;
const MIN_PITCH_SAMPLE_RELIABLE = 20;

function diffHoursFromNow(timestamp: string): number | null {
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) return null;
  return Math.abs(Date.now() - parsed) / (1000 * 60 * 60);
}

function worstConfidence(a: ConfidenceLabel, b: ConfidenceLabel): ConfidenceLabel {
  const order: ConfidenceLabel[] = ["LOW", "MEDIUM", "HIGH"];
  return order.indexOf(a) <= order.indexOf(b) ? a : b;
}

export function validateSlate(request: HrEngineRequestV2): SlateValidationResult {
  const reasons: string[] = [];
  let dataQuality: DataQualityLabel = "HIGH";
  let downgraded = false;

  const { game, batter, pitcher, bullpen, environment, market } = request;

  const downgrade = (reason: string, next: Exclude<DataQualityLabel, "INVALID"> = "LOW") => {
    reasons.push(reason);
    downgraded = true;
    if (dataQuality !== "INVALID") {
      if (next === "LOW") dataQuality = "LOW";
      else if (dataQuality === "HIGH") dataQuality = "MEDIUM";
    }
  };

  const invalidate = (reason: string) => {
    reasons.push(reason);
    dataQuality = "INVALID";
  };

  if (batter.lineupStatus !== "confirmed" || !game.confirmedLineupsStatus) {
    downgrade("Lineup is unconfirmed.", "LOW");
  }

  if (batter.projectedPlateAppearances == null) {
    invalidate("Projected plate appearances missing.");
  }

  if (safeNumber(batter.starterProbability, 0) < STARTER_PROBABILITY_MIN) {
    invalidate("Starter probability below required threshold.");
  }

  if (environment.weatherConfidence === "LOW") {
    downgrade("Weather confidence is poor.", "LOW");
  }

  if (!bullpen.projectedAvailableRelievers || bullpen.projectedAvailableRelievers <= 0) {
    downgrade("Bullpen availability is incomplete.", "LOW");
  }

  if (!batter.pitchTypeSkill) {
    downgrade("Pitch-type skill data missing.", "LOW");
  } else {
    const counts = Object.values(batter.pitchTypeSkill.sampleCounts ?? {});
    const hasWeakSamples =
      counts.length === 0 || counts.some((count) => safeNumber(count, 0) < MIN_PITCH_SAMPLE_RELIABLE);

    if (hasWeakSamples) {
      downgrade("Pitch-type skill samples are weak.", "LOW");
    }
  }

  if (market) {
    const staleHours = diffHoursFromNow(market.marketTimestamp);
    if (staleHours == null || staleHours > MARKET_STALE_HOURS) {
      downgrade("Odds timestamp is stale.", "LOW");
    }

    dataQuality =
      dataQuality === "INVALID"
        ? "INVALID"
        : worstConfidence(dataQuality === "HIGH" ? "HIGH" : dataQuality === "MEDIUM" ? "MEDIUM" : "LOW", market.marketLimitQuality) === "LOW"
          ? "LOW"
          : dataQuality;
  }

  if (pitcher.pitchMixUsage == null) {
    downgrade("Pitch mix usage missing.", "LOW");
  }

  return {
    dataQuality,
    reasons,
    downgraded,
  };
}
