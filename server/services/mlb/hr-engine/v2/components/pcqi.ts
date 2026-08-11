import type { BatterProfileV2, ComponentResult, Rolling30dMetrics } from "../types";
import { clamp01, safeNumber } from "../shared/normalize";
import { decayWeightDaysAgo } from "../shared/decay";

function get14dEvents(batter: BatterProfileV2, now = new Date()) {
  return batter.rolling14dBbeLog.filter((event) => {
    const eventDate = new Date(event.event_date);
    const diffDays = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
    return Number.isFinite(diffDays) && diffDays >= 0 && diffDays <= 14;
  });
}

function getFormWeightedBarrel(batter: BatterProfileV2, now = new Date()): number {
  const events = get14dEvents(batter, now);
  if (events.length === 0) return 0;

  let weightedBarrels = 0;
  let totalWeight = 0;

  for (const event of events) {
    const eventDate = new Date(event.event_date);
    const diffDays = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
    const weight = decayWeightDaysAgo(diffDays, 7);

    weightedBarrels += safeNumber(event.barrel_flag, 0) * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 0;
  return clamp01(weightedBarrels / totalWeight);
}

function get14dAirHardHitRate(batter: BatterProfileV2, now = new Date()): number {
  const events = get14dEvents(batter, now);
  if (events.length === 0) return 0;

  const qualifying = events.filter((event) => event.launch_angle >= 10 && event.exit_velocity >= 95);
  return clamp01(qualifying.length / events.length);
}

function getAverageEv14d(batter: BatterProfileV2, now = new Date()): number {
  const events = get14dEvents(batter, now);
  if (events.length === 0) return 0;

  const total = events.reduce((sum, event) => sum + safeNumber(event.exit_velocity, 0), 0);
  return total / events.length;
}

function getPullAirPercent14d(batter: BatterProfileV2, now = new Date()): number {
  const events = get14dEvents(batter, now);
  if (events.length === 0) return 0;

  const pullAirBalls = events.filter((event) => event.launch_angle >= 10 && Math.abs(event.spray_direction) >= 15);
  return clamp01(pullAirBalls.length / events.length);
}

function getSweetSpotPercent14d(batter: BatterProfileV2, now = new Date()): number {
  const events = get14dEvents(batter, now);
  if (events.length === 0) return 0;

  const sweetSpot = events.filter((event) => event.launch_angle >= 8 && event.launch_angle <= 32);
  return clamp01(sweetSpot.length / events.length);
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
  const has14dBbe = batter.rolling14dBbeLog.length > 0;
  const has30dMetrics = batter.rolling30dMetrics != null;

  const formWeightedBarrel = getFormWeightedBarrel(batter, now);
  const airHardHit = get14dAirHardHitRate(batter, now);
  const xwobaCon30d = clamp01(safeNumber(batter.rolling30dMetrics?.xwOBAcon, 0));
  const contactTrajectoryBoost = computeContactTrajectoryBoost(batter, batter.rolling30dMetrics);

  const rawPcqi =
    0.4 * formWeightedBarrel +
    0.3 * airHardHit +
    0.2 * xwobaCon30d +
    0.1 * contactTrajectoryBoost;

  const notes = [
    `Form_Weighted_Barrel=${formWeightedBarrel.toFixed(4)}`,
    `Air_Hard_Hit=${airHardHit.toFixed(4)}`,
    `xwOBAcon_30d=${xwobaCon30d.toFixed(4)}`,
    `Contact_Trajectory_Boost=${contactTrajectoryBoost.toFixed(4)}`,
    `Raw_PCQI=${rawPcqi.toFixed(4)}`,
  ];

  if (!has14dBbe) {
    notes.push("PCQI_PARTIAL: 14-day batted-ball events unavailable.");
  }

  if (!has30dMetrics) {
    notes.push("PCQI_PARTIAL: 30-day Statcast metrics unavailable.");
  }

  return {
    value: clamp01(rawPcqi),
    notes,
  };
}
