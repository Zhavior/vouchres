import type { BatterProfile, EnvironmentInput, GameContextInput } from "../types";
import { clampToUnitScale, normalizeMinMax } from "../normalize";

function directionalParkFactor(
  batter: BatterProfile,
  env: EnvironmentInput,
): number {
  const pullLeft = env.park_factor_pull_left / 100;
  const pullRight = env.park_factor_pull_right / 100;
  const center = env.park_factor_center / 100;
  const pullAir = batter.rolling_30d_metrics.pull_air_percent / 100;

  if (batter.handedness === "L") {
    return pullRight * pullAir + center * (1 - pullAir);
  }
  if (batter.handedness === "R") {
    return pullLeft * pullAir + center * (1 - pullAir);
  }
  return env.park_factor_hr_overall / 100;
}

function roofAdjustment(roofStatus: GameContextInput["roof_status"]): number {
  if (roofStatus === "closed") return 0;
  return 1;
}

export function computeEpv(
  batter: BatterProfile,
  env: EnvironmentInput,
  game: GameContextInput,
): { normalized: number; breakdown: Record<string, number | string> } {
  const directional = directionalParkFactor(batter, env);
  const temperatureBoost = 1 + (env.temperature - 72) * 0.0015;
  const windBoost = 1 + env.wind_vector_outbound_mph * 0.015;
  const roofAdj = roofAdjustment(game.roof_status);

  const rawEpv = directional * temperatureBoost * windBoost * (roofAdj === 0 ? 1 : roofAdj);
  const normalized = clampToUnitScale(normalizeMinMax(rawEpv, 0.85, 1.25));

  return {
    normalized,
    breakdown: {
      directional_park_factor: directional,
      temperature_boost: temperatureBoost,
      wind_boost: windBoost,
      roof_adjustment: roofAdj === 0 ? "neutralized" : "active",
      raw_epv: rawEpv,
    },
  };
}
