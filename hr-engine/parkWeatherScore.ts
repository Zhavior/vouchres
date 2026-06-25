/**
 * Park + Weather Score (Section 8)
 *
 * Formula:
 *   Park Multiplier = Park HR Factor / 100
 *
 *   Temperature Boost = (Game Temp - 70) × 0.005
 *   Wind Boost = Wind Out MPH × 0.01  (or -Wind In MPH × 0.01)
 *   Weather Multiplier = 1 + Temperature Boost + Wind Boost
 *
 *   Combined Multiplier = Park Multiplier × Weather Multiplier
 *
 * Labels:
 *   🚀 Carry Boost         — combined boost > +15%
 *   🌬️ Wind Out             — wind blowing out 5+ mph
 *   🧊 Cold Suppression     — temp < 60°F
 *   🏟️ Park Boost          — park factor > 110
 *   ⚠️ Wind In              — wind blowing in 5+ mph
 */

import { ParkWeatherInputs, ParkWeatherResult } from "./types";
import {
  PARK_FACTOR_DIVISOR,
  TEMP_BASELINE_F,
  TEMP_BOOST_PER_DEGREE,
  WIND_BOOST_PER_MPH,
  WIND_PENALTY_PER_MPH,
} from "./constants";

export function calculateParkWeatherScore(inputs: ParkWeatherInputs): ParkWeatherResult {
  const parkMultiplier = inputs.parkHrFactor / PARK_FACTOR_DIVISOR;

  // Temperature boost (linear, no cap)
  const tempBoost = (inputs.temperatureF - TEMP_BASELINE_F) * TEMP_BOOST_PER_DEGREE;

  // Wind boost (signed)
  let windBoost = 0;
  if (inputs.windDirection === "out") {
    windBoost = inputs.windMph * WIND_BOOST_PER_MPH;
  } else if (inputs.windDirection === "in") {
    windBoost = -inputs.windMph * WIND_PENALTY_PER_MPH;
  }
  // Cross wind and neutral → no boost

  // Precipitation reduces HR probability (slick ball, slower swing, game-delay risk)
  const precipPenalty = inputs.precipitation ? -0.05 : 0;

  const weatherMultiplier = 1 + tempBoost + windBoost + precipPenalty;
  const combinedMultiplier = parkMultiplier * weatherMultiplier;
  const boost = combinedMultiplier - 1;

  return {
    parkMultiplier,
    weatherMultiplier: Math.round(weatherMultiplier * 1000) / 1000,
    combinedMultiplier: Math.round(combinedMultiplier * 1000) / 1000,
    boost: Math.round(boost * 1000) / 1000,
    temperatureF: inputs.temperatureF,
    windMph: inputs.windMph,
    windDirection: inputs.windDirection,
    label: getWeatherLabel(boost, inputs),
  };
}

function getWeatherLabel(boost: number, inputs: ParkWeatherInputs): string {
  const labels: string[] = [];
  if (boost >= 0.15) labels.push("🚀 Carry Boost");
  if (inputs.windDirection === "out" && inputs.windMph >= 5) labels.push("🌬️ Wind Out");
  if (inputs.windDirection === "in" && inputs.windMph >= 5) labels.push("⚠️ Wind In");
  if (inputs.temperatureF < 60) labels.push("🧊 Cold Suppression");
  if (inputs.parkHrFactor >= 110) labels.push("🏟️ Park Boost");
  if (inputs.parkHrFactor <= 90) labels.push("🏟️ Pitcher's Park");
  if (inputs.precipitation) labels.push("🌧️ Precip Risk");

  if (labels.length === 0) return "Neutral conditions";
  return labels.join(" + ");
}
