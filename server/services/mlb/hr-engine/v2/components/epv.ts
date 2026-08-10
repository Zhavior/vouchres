import type { BatterProfileV2, ComponentResult, EnvironmentVectorV2 } from "../types";
import { clamp01, normalizeRange, safeNumber } from "../shared/normalize";

function getDirectionalParkFactor(batter: BatterProfileV2, environment: EnvironmentVectorV2): number {
  const pullAirFit = safeNumber(batter.splitProfile?.pull_side_hr_fit, 0.5);

  const pullFactor =
    batter.handedness === "L"
      ? environment.parkFactorPullRight
      : environment.parkFactorPullLeft;

  const centerFactor = environment.parkFactorCenter;
  const overallFactor = environment.parkFactorHrOverall;

  const weighted =
    pullFactor * clamp01(pullAirFit) * 0.6 +
    centerFactor * (1 - clamp01(pullAirFit)) * 0.25 +
    overallFactor * 0.15;

  return weighted;
}

function getTemperatureBoost(environment: EnvironmentVectorV2): number {
  const temperature = safeNumber(environment.temperature, 72);
  return 1 + (temperature - 72) * 0.0015;
}

function getWindBoost(environment: EnvironmentVectorV2): number {
  const outbound = safeNumber(environment.windVectorOutboundMph, 0);
  return 1 + outbound * 0.015;
}

function getRoofAdjustment(environment: EnvironmentVectorV2): number {
  const roofClosed =
    environment.roofStatus === "closed" || environment.roofStatus === "retractable_closed";

  return roofClosed ? 1 : 1;
}

export function calculateEPV(batter: BatterProfileV2, environment: EnvironmentVectorV2): ComponentResult {
  const directionalParkFactor = getDirectionalParkFactor(batter, environment);
  const roofClosed =
    environment.roofStatus === "closed" || environment.roofStatus === "retractable_closed";

  const temperatureBoost = roofClosed ? 1 : getTemperatureBoost(environment);
  const windBoost = roofClosed ? 1 : getWindBoost(environment);
  const roofAdjustment = getRoofAdjustment(environment);

  const rawEpv = directionalParkFactor * temperatureBoost * windBoost * roofAdjustment;
  const normalizedEpv = normalizeRange(rawEpv, 85, 125, 0.5);

  return {
    value: clamp01(normalizedEpv),
    notes: [
      `Directional_Park_Factor=${directionalParkFactor.toFixed(4)}`,
      `Temperature_Boost=${temperatureBoost.toFixed(4)}`,
      `Wind_Boost=${windBoost.toFixed(4)}`,
      `Roof_Adjustment=${roofAdjustment.toFixed(4)}`,
      `Raw_EPV=${rawEpv.toFixed(4)}`,
      `Normalized_EPV=${normalizedEpv.toFixed(4)}`,
    ],
  };
}
