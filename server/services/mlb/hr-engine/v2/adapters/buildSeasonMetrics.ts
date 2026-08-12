import type { SeasonMetrics } from "../types";
import {
  getBattedBallProfileMapResult,
  getSingleYearStatcastBatterMap,
} from "../../../statcastClient";

type BuildSeasonMetricsResult = {
  seasonMetrics: SeasonMetrics | null;
  warnings: string[];
};

function asRate(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return value > 1 ? value / 100 : value;
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

  if (battedBallResult.feedStatus !== "ok") {
    warnings.push(
      `Batted-ball profile feed unavailable${battedBallResult.errorMessage ? `: ${battedBallResult.errorMessage}` : "."}`,
    );
  }

  if (!quality && !profile) {
    return { seasonMetrics: null, warnings };
  }

  if (!quality || !profile) {
    warnings.push("Incomplete season Statcast inputs; V2 season metrics withheld rather than zero-filled.");
    return { seasonMetrics: null, warnings };
  }

  const seasonMetrics: SeasonMetrics = {
    EV: quality.avgExitVelo ?? 0,
    FB_percent: asRate(profile.fbPct) ?? 0,
    HH_percent: asRate(quality.hardHitPct) ?? 0,
    Barrel_percent: asRate(quality.barrelPct) ?? 0,
    // Do not relabel leaderboard xwOBA as contact-only xwOBAcon.
    xwOBAcon: null,
    pull_air_percent: asRate(profile.pullAirPct) ?? 0,
    avg_launch_angle: quality.avgLaunchAngle ?? 0,
    sweet_spot_percent: asRate(quality.sweetSpotPct) ?? 0,
  };

  warnings.push("xwOBAcon unavailable from the current official leaderboard feed; field left null.");

  return {
    seasonMetrics,
    warnings,
  };
}
