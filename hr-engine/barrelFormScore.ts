/**
 * Barrel Form Score (Section 4)
 *
 * Formula:
 *   Barrel Form Score =
 *     (Season Barrel% × 0.50)
 *     + (Last 15 Days Barrel% × 0.30)
 *     + (Last 7 Days Barrel% × 0.20)
 *
 * Then convert each rate to a percentile/score (rate × 1000 capped at 100,
 * then normalized to 0-100 via percentile approximation).
 *
 * Small-sample warning: if Last 7 Days Batted Balls < 10, lower confidence.
 *
 * Trend labels:
 *   🔥 Heating Up      — last 7 > season by 4+ pp
 *   🧊 Cold Contact     — last 7 < season by 4+ pp
 *   ⚠️ Small Sample    — fewer than 10 batted balls in last 7
 *   ✅ Stable Power     — last 7 within 4pp of season
 */

import { BarrelFormInputs, BarrelFormResult } from "./types";
import { BARREL_FORM_WEIGHTS, SMALL_SAMPLE_THRESHOLD_7D } from "./constants";
import { LEAGUE_AVERAGES, LEAGUE_STD_DEVS } from "./constants";
import { rateToPercentile } from "./regression";

export function calculateBarrelFormScore(inputs: BarrelFormInputs): BarrelFormResult {
  // Convert each barrel rate to a percentile (0-100), then weight
  const seasonPct = rateToPercentile(
    inputs.seasonBarrelRate,
    LEAGUE_AVERAGES.barrelRate,
    LEAGUE_STD_DEVS.barrelRate
  );
  const last15Pct = rateToPercentile(
    inputs.last15BarrelRate,
    LEAGUE_AVERAGES.barrelRate,
    LEAGUE_STD_DEVS.barrelRate
  );
  const last7Pct = rateToPercentile(
    inputs.last7BarrelRate,
    LEAGUE_AVERAGES.barrelRate,
    LEAGUE_STD_DEVS.barrelRate
  );

  const score =
    seasonPct * BARREL_FORM_WEIGHTS.season +
    last15Pct * BARREL_FORM_WEIGHTS.last15 +
    last7Pct * BARREL_FORM_WEIGHTS.last7;

  const smallSample = inputs.last7BattedBalls < SMALL_SAMPLE_THRESHOLD_7D;
  const delta = inputs.last7BarrelRate - inputs.seasonBarrelRate;

  let trend: BarrelFormResult["trend"];
  if (smallSample) {
    trend = "small_sample";
  } else if (delta >= 0.04) {
    trend = "heating_up";
  } else if (delta <= -0.04) {
    trend = "cold";
  } else {
    trend = "stable";
  }

  return {
    score: Math.round(score * 10) / 10,
    trend,
    last15BarrelRate: inputs.last15BarrelRate,
    last7BarrelRate: inputs.last7BarrelRate,
    last7HardHitRate: inputs.last7HardHitRate,
    smallSampleWarning: smallSample,
    label: getTrendLabel(trend),
  };
}

function getTrendLabel(trend: BarrelFormResult["trend"]): string {
  switch (trend) {
    case "heating_up":  return "🔥 Heating Up";
    case "cold":         return "🧊 Cold Contact";
    case "small_sample": return "⚠️ Small Sample";
    case "stable":       return "✅ Stable Power";
  }
}
