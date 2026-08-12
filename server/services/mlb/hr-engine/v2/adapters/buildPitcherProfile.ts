import type { PitcherSeasonStats } from "../../../statsClient";
import {
  getPitchMixMapResult,
  type StatcastPitchMixRow,
} from "../../../statcastClient";
import type { Handedness, PitcherProfileV2 } from "../types";
import { buildUsageFromRows } from "./buildPitchMixUsage";

export type BuildPitcherProfileInput = {
  pitcherId: number;
  pitcherName: string;
  handedness: Handedness;
  seasonStats: PitcherSeasonStats | null;
  year?: number;
};

export type BuildPitcherProfileResult = {
  pitcher: PitcherProfileV2;
  warnings: string[];
};

function asRate(value: number | null): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return value > 1 ? value / 100 : value;
}

function weightedMetric(
  rows: StatcastPitchMixRow[],
  value: (row: StatcastPitchMixRow) => number | null,
  weight: (row: StatcastPitchMixRow) => number | null,
): number | null {
  let weighted = 0;
  let totalWeight = 0;

  for (const row of rows) {
    const metric = value(row);
    const rowWeight = weight(row);
    if (metric == null || rowWeight == null || rowWeight <= 0) continue;
    weighted += metric * rowWeight;
    totalWeight += rowWeight;
  }

  return totalWeight > 0 ? weighted / totalWeight : null;
}

export async function buildPitcherProfile(
  input: BuildPitcherProfileInput,
): Promise<BuildPitcherProfileResult> {
  const { map, feedStatus, errorMessage } = await getPitchMixMapResult(input.year);
  const rows = map[input.pitcherId] ?? [];
  const warnings: string[] = [];

  if (feedStatus !== "ok") {
    warnings.push(
      errorMessage
        ? `Pitcher Statcast feed unavailable: ${errorMessage}`
        : "Pitcher Statcast feed unavailable.",
    );
  } else if (rows.length === 0) {
    warnings.push("No official Statcast pitch-arsenal rows were available for the pitcher.");
  }

  const projectedInnings =
    input.seasonStats && input.seasonStats.gamesStarted > 0
      ? input.seasonStats.inningsPitched / input.seasonStats.gamesStarted
      : null;

  return {
    pitcher: {
      pitcherId: input.pitcherId,
      pitcherName: input.pitcherName,
      handedness: input.handedness,
      projectedInnings,
      pitchMixUsage: buildUsageFromRows(rows),
      // Savant exposes whiff rate, not swinging-strike rate. Keep the latter null.
      swingingStrikePercent: null,
      whiffPercent: asRate(weightedMetric(rows, (row) => row.whiffPct, (row) => row.pitches)),
      hrPerFbAllowed: null,
      barrelPercentAllowed: null,
      flyBallPercentAllowed: null,
      xSlgAllowed: weightedMetric(rows, (row) => row.xslg, (row) => row.pa),
      FIP: null,
      xFIP: null,
      recentPitchMixChange: null,
      recentVelocityChange: null,
      timesThroughOrderExpectation: null,
    },
    warnings,
  };
}
