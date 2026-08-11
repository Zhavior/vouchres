import type { SeasonMetrics } from "../types";
import {
  getBattedBallProfileMapResult,
  getSingleYearStatcastBatterMap,
} from "../../../statcastClient";

type BuildSeasonMetricsResult = {
  seasonMetrics: SeasonMetrics | null;
  warnings: string[];
};

function asPercent(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return value;
}

function avgLaunchAngleFromProfile(profile: {
  gbPct: number | null;
  fbPct: number | null;
  ldPct: number | null;
}): number | null {
  const gb = profile.gbPct ?? 0;
  const fb = profile.fbPct ?? 0;
  const ld = profile.ldPct ?? 0;
  const total = gb + fb + ld;

  if (total <= 0) return null;

  const gbAngle = -10;
  const ldAngle = 12;
  const fbAngle = 32;

  return ((gb * gbAngle) + (ld * ldAngle) + (fb * fbAngle)) / total;
}

function sweetSpotFromProfile(profile: {
  ldPct: number | null;
  fbPct: number | null;
}): number | null {
  const ld = profile.ldPct ?? 0;
  const fb = profile.fbPct ?? 0;
  const estimate = ld + fb * 0.35;
  return Number.isFinite(estimate) ? estimate : null;
}

export async function buildSeasonMetrics(
  batterId: number,
  year: number,
): Promise<BuildSeasonMetricsResult> {
  const warnings: string[] = [];

  const [seasonMap, battedBallResult] = await Promise.all([
    getSingleYearStatcastBatterMap(year),
    getBattedBallProfileMapResult(year),
  ]);

  const quality = seasonMap[batterId];
  const profile = battedBallResult.map[batterId];

  if (!quality) {
    warnings.push(`No season Statcast quality found for batter ${batterId}.`);
  }

  if (!profile) {
    warnings.push(`No batted-ball profile found for batter ${batterId}.`);
  }

  if (!quality && !profile) {
    return { seasonMetrics: null, warnings };
  }

  if (battedBallResult.feedStatus !== "ok") {
    warnings.push(
      `Batted-ball profile feed unavailable${battedBallResult.errorMessage ? `: ${battedBallResult.errorMessage}` : "."}`,
    );
  }

  const seasonMetrics: SeasonMetrics = {
    EV: quality?.avgExitVelo ?? 0,
    FB_percent: asPercent(profile?.fbPct) ?? 0,
    HH_percent: asPercent(quality?.hardHitPct) ?? 0,
    Barrel_percent: asPercent(quality?.barrelPct) ?? 0,
    xwOBAcon: quality?.xwoba ?? 0,
    pull_air_percent: asPercent(profile?.pullAirPct) ?? 0,
    avg_launch_angle: avgLaunchAngleFromProfile({
      gbPct: profile?.gbPct ?? null,
      fbPct: profile?.fbPct ?? null,
      ldPct: profile?.ldPct ?? null,
    }) ?? 0,
    sweet_spot_percent: sweetSpotFromProfile({
      ldPct: profile?.ldPct ?? null,
      fbPct: profile?.fbPct ?? null,
    }) ?? 0,
  };

  return {
    seasonMetrics,
    warnings,
  };
}
