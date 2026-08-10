import type { BatterProfileV2, ComponentResult, Rolling30dMetrics } from "../types";
import { expDecayWeight } from "../shared/decay";
import { clamp01, safeNumber } from "../shared/normalize";

const AIR_HARD_HIT_MIN_LA = 20;
const AIR_HARD_HIT_MAX_LA = 35;
const AIR_HARD_HIT_MIN_EV = 95;

function daysSince(dateString: string, now = new Date()): number {
  const parsed = Date.parse(dateString);
  if (Number.isNaN(parsed)) return Number.POSITIVE_INFINITY;
  const diffMs = now.getTime() - parsed;
  return Math.max(0, diffMs / (1000 * 60 * 60 * 24));
}

function get14dAirHardHitRate(batter: BatterProfileV2): number {
  const bbe = batter.rolling14dBbeLog;
  if (bbe.length === 0) return 0;

  const matching = bbe.filter(
    (entry) =>
      entry.launch_angle >= AIR_HARD_HIT_MIN_LA &&
      entry.launch_angle <= AIR_HARD_HIT_MAX_LA &&
      entry.exit_velocity >= AIR_HARD_HIT_MIN_EV,
  );

  return matching.length / bbe.length;
}

function getFormWeightedBarrel(batter: BatterProfileV2, now = new Date()): number {
  const bbe = batter.rolling14dBbeLog;
  if (bbe.length === 0) return 0;

  let numerator = 0;
  let denominator = 0;

  for (const event of bbe) {
    const t = daysSince(event.event_date, now);
    const weight = expDecayWeight(t, 0.05);
    numerator += event.barrel_flag * weight;
    denominator += weight;
  }

  if (denominator <= 0) return 0;
  return numerator / denominator;
}

function getAverageEv14d(batter: BatterProfileV2): number {
  const bbe = batter.rolling14dBbeLog;
  if (bbe.length === 0) return 0;

  const total = bbe.reduce((sum, entry) => sum + safeNumber(entry.exit_velocity, 0), 0);
  return total / bbe.length;
}

function getPullAirPercent14d(batter: BatterProfileV2): number {
  const bbe = batter.rolling14dBbeLog;
  if (bbe.length === 0) return 0;

  const airborne = bbe.filter((entry) => entry.launch_angle >= AIR_HARD_HIT_MIN_LA);
  if (airborne.length === 0) return 0;

  const pullSide = batter.handedness === "L"
    ? airborne.filter((entry) => entry.spray_direction > 0)
    : airborne.filter((entry) => entry.spray_direction < 0);

  return pullSide.length / airborne.length;
}

function getSweetSpotPercent14d(batter: BatterProfileV2): number {
  const bbe = batter.rolling14dBbeLog;
  if (bbe.length === 0) return 0;

  const sweetSpot = bbe.filter((entry) => entry.launch_angle >= 8 && entry.launch_angle <= 32);
  return sweetSpot.length / bbe.length;
}

function relativeImprovement(current: number, baseline: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(baseline)) return 0;
  const denom = Math.max(Math.abs(baseline), 0.01);
  return (current - baseline) / denom;
}

function computeContactTrajectoryBoost(
  batter: BatterProfileV2,
  rolling30d: Rolling30dMetrics | null,
): number {
  if (!rolling30d) return 0;

  const trendAirHardHit = relativeImprovement(get14dAirHardHitRate(batter), safeNumber(rolling30d.air_hard_hit_rate, 0));
  const trendAverageEv = relativeImprovement(getAverageEv14d(batter), safeNumber(rolling30d.EV, 0));
  const trendPullAir = relativeImprovement(getPullAirPercent14d(batter), safeNumber(rolling30d.pull_air_percent, 0));
  const trendSweetSpot = relativeImprovement(
    getSweetSpotPercent14d(batter),
    safeNumber(batter.seasonMetrics?.sweet_spot_percent, 0),
  );

  const rawTrend =
    trendAirHardHit * 0.35 +
    trendAverageEv * 0.25 +
    trendPullAir * 0.2 +
    trendSweetSpot * 0.2;

  return clamp01(0.5 + rawTrend * 0.5);
}

export function calculatePCQI(batter: BatterProfileV2, now = new Date()): ComponentResult {
  const formWeightedBarrel = getFormWeightedBarrel(batter, now);
  const airHardHit = get14dAirHardHitRate(batter);
  const xwobaCon30d = clamp01(safeNumber(batter.rolling30dMetrics?.xwOBAcon, 0));
  const contactTrajectoryBoost = computeContactTrajectoryBoost(batter, batter.rolling30dMetrics);

  const rawPcqi =
    0.4 * formWeightedBarrel +
    0.3 * airHardHit +
    0.2 * xwobaCon30d +
    0.1 * contactTrajectoryBoost;

  return {
    value: clamp01(rawPcqi),
    notes: [
      `Form_Weighted_Barrel=${formWeightedBarrel.toFixed(4)}`,
      `Air_Hard_Hit=${airHardHit.toFixed(4)}`,
      `xwOBAcon_30d=${xwobaCon30d.toFixed(4)}`,
      `Contact_Trajectory_Boost=${contactTrajectoryBoost.toFixed(4)}`,
      `Raw_PCQI=${rawPcqi.toFixed(4)}`,
    ],
  };
}
