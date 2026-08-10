import type { BullpenProfileV2, ComponentResult, PitcherProfileV2 } from "../types";
import { clamp01, normalizeRange, safeNumber } from "../shared/normalize";

function getPitcherAirVulnerability(pitcher: PitcherProfileV2): number {
  const hrPerFb = safeNumber(pitcher.hrPerFbAllowed, 0);
  const swingingStrikePercent = safeNumber(pitcher.swingingStrikePercent, 0);
  const raw = hrPerFb * (1 - swingingStrikePercent);
  return normalizeRange(raw, 0.02, 0.2, 0);
}

function getRegressionIndicator(pitcher: PitcherProfileV2): number {
  const raw = Math.max(0, safeNumber(pitcher.FIP, 0) - safeNumber(pitcher.xFIP, 0));
  return normalizeRange(raw, 0, 1.5, 0);
}

function getContactDamageAllowed(pitcher: PitcherProfileV2): number {
  const barrel = normalizeRange(pitcher.barrelPercentAllowed, 0.03, 0.15, 0);
  const flyBall = normalizeRange(pitcher.flyBallPercentAllowed, 0.2, 0.55, 0);
  const xslg = normalizeRange(pitcher.xSlgAllowed, 0.28, 0.6, 0);

  return clamp01(barrel * 0.4 + flyBall * 0.25 + xslg * 0.35);
}

function getBullpenExposureBoost(bullpen: BullpenProfileV2): number {
  const fatigue = normalizeRange(bullpen.bullpenFatigueIndex, 0, 1, 0);
  const pitchCount = normalizeRange(bullpen.last3DaysPitchCount, 20, 140, 0);
  const highLeverage = normalizeRange(bullpen.last2DaysHighLeverageUsage, 0, 8, 0);
  const hrPerFb = normalizeRange(bullpen.bullpenHrPerFb, 0.02, 0.18, 0);
  const barrelAllowed = normalizeRange(bullpen.bullpenBarrelPercentAllowed, 0.03, 0.14, 0);

  return clamp01(
    fatigue * 0.3 +
    pitchCount * 0.2 +
    highLeverage * 0.15 +
    hrPerFb * 0.2 +
    barrelAllowed * 0.15,
  );
}

export function calculatePVM(pitcher: PitcherProfileV2, bullpen: BullpenProfileV2): ComponentResult {
  const pitcherAirVulnerability = getPitcherAirVulnerability(pitcher);
  const regressionIndicator = getRegressionIndicator(pitcher);
  const contactDamageAllowed = getContactDamageAllowed(pitcher);
  const bullpenExposureBoost = getBullpenExposureBoost(bullpen);

  const rawPvm =
    0.35 * pitcherAirVulnerability +
    0.2 * regressionIndicator +
    0.25 * contactDamageAllowed +
    0.2 * bullpenExposureBoost;

  return {
    value: clamp01(rawPvm),
    notes: [
      `Pitcher_Air_Vulnerability=${pitcherAirVulnerability.toFixed(4)}`,
      `Regression_Indicator=${regressionIndicator.toFixed(4)}`,
      `Contact_Damage_Allowed=${contactDamageAllowed.toFixed(4)}`,
      `Bullpen_Exposure_Boost=${bullpenExposureBoost.toFixed(4)}`,
      `Raw_PVM=${rawPvm.toFixed(4)}`,
    ],
  };
}
