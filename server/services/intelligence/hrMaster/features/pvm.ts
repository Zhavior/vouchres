import type { BullpenProfile, StartingPitcherProfile } from "../types";
import { HR_MASTER_MODEL } from "../modelConfig";
import { clampToUnitScale, normalizeMinMax } from "../normalize";

const { league_baselines: lb } = HR_MASTER_MODEL;

export function computePvm(
  pitcher: StartingPitcherProfile,
  bullpen: BullpenProfile,
): { normalized: number; breakdown: Record<string, number> } {
  const pitcherAirVulnerability = normalizeMinMax(
    pitcher.HR_per_FB_allowed * (1 - pitcher.swinging_strike_percent),
    0.04,
    0.18,
  );

  const regressionIndicator = normalizeMinMax(
    Math.max(0, pitcher.FIP - pitcher.xFIP),
    0,
    1.5,
  );

  const contactDamageAllowed = normalizeMinMax(
    0.40 * (pitcher.barrel_percent_allowed / lb.barrel_allowed) +
      0.30 * (pitcher.fly_ball_percent_allowed / lb.fly_ball_allowed) +
      0.30 * (pitcher.xSLG_allowed / lb.xSLG_allowed),
    0.6,
    1.5,
  );

  const bullpenExposureBoost = normalizeMinMax(
    0.30 * bullpen.bullpen_fatigue_index +
      0.20 * normalizeMinMax(bullpen.last_3_days_pitch_count, 80, 220) +
      0.15 * normalizeMinMax(bullpen.last_2_days_high_leverage_usage, 0, 8) +
      0.20 * normalizeMinMax(bullpen.bullpen_HR_per_FB / lb.bullpen_HR_per_FB, 0.7, 1.4) +
      0.15 * normalizeMinMax(bullpen.bullpen_barrel_percent_allowed / lb.barrel_allowed, 0.7, 1.3),
    0,
    1,
  );

  const rawPvm =
    0.35 * pitcherAirVulnerability +
    0.20 * regressionIndicator +
    0.25 * contactDamageAllowed +
    0.20 * bullpenExposureBoost;

  return {
    normalized: clampToUnitScale(rawPvm),
    breakdown: {
      pitcher_air_vulnerability: pitcherAirVulnerability,
      regression_indicator: regressionIndicator,
      contact_damage_allowed: contactDamageAllowed,
      bullpen_exposure_boost: bullpenExposureBoost,
      raw_pvm: rawPvm,
    },
  };
}
