import type {
  BatterProfile,
  BbeLogEntry,
  Rolling30dMetrics,
  SeasonMetrics,
} from "../types";
import { clampToUnitScale, daysSince, normalizeMinMax } from "../normalize";

const DECAY = 0.05;

function airHardHitFromLog(bbeLog: BbeLogEntry[]): number {
  if (bbeLog.length === 0) return 0;
  const hits = bbeLog.filter(
    (b) => b.launch_angle >= 20 && b.launch_angle <= 35 && b.exit_velocity >= 95,
  ).length;
  return hits / bbeLog.length;
}

function formWeightedBarrel(bbeLog: BbeLogEntry[], referenceDate: string): number {
  if (bbeLog.length === 0) return 0;
  let weighted = 0;
  let totalWeight = 0;
  for (const entry of bbeLog) {
    const t = daysSince(entry.event_date, referenceDate);
    const w = Math.exp(-DECAY * t);
    weighted += (entry.barrel_flag ? 1 : 0) * w;
    totalWeight += w;
  }
  return totalWeight > 0 ? weighted / totalWeight : 0;
}

function contactTrajectoryBoost(
  season: SeasonMetrics,
  rolling30: Rolling30dMetrics,
): number {
  const airTrend = (rolling30.air_hard_hit_rate ?? 0) - airHardHitProxy(season);
  const evTrend = (rolling30.EV - season.EV) / 10;
  const pullTrend = (rolling30.pull_air_percent - season.pull_air_percent) / 20;
  const sweetTrend = (rolling30.avg_launch_angle - season.avg_launch_angle) / 15;
  const raw = 0.35 * airTrend + 0.30 * evTrend + 0.20 * pullTrend + 0.15 * sweetTrend;
  return normalizeMinMax(raw, -0.15, 0.15);
}

function airHardHitProxy(season: SeasonMetrics): number {
  return normalizeMinMax(season.HH_percent / 100, 0.15, 0.55) * 0.5
    + normalizeMinMax(season.sweet_spot_percent / 100, 0.20, 0.40) * 0.5;
}

export function computePcqi(
  batter: BatterProfile,
  referenceDate: string,
): { normalized: number; breakdown: Record<string, number> } {
  const { season_metrics: season, rolling_30d_metrics: rolling30, rolling_14d_bbe_log: bbeLog } = batter;

  const weightedBarrel = formWeightedBarrel(bbeLog, referenceDate);
  const airHardHit = bbeLog.length > 0
    ? airHardHitFromLog(bbeLog)
    : rolling30.air_hard_hit_rate ?? airHardHitProxy(season);
  const xwOBAcon30 = normalizeMinMax(rolling30.xwOBAcon, 0.300, 0.520);
  const trajectoryBoost = contactTrajectoryBoost(season, rolling30);

  const rawPcqi =
    0.40 * weightedBarrel +
    0.30 * airHardHit +
    0.20 * xwOBAcon30 +
    0.10 * trajectoryBoost;

  const normalized = clampToUnitScale(
    normalizeMinMax(rawPcqi, 0, 0.55) * 0.7 +
      normalizeMinMax(season.Barrel_percent / 100, 0.02, 0.22) * 0.3,
  );

  return {
    normalized,
    breakdown: {
      form_weighted_barrel: weightedBarrel,
      air_hard_hit: airHardHit,
      xwOBAcon_30d: xwOBAcon30,
      contact_trajectory_boost: trajectoryBoost,
      raw_pcqi: rawPcqi,
    },
  };
}
