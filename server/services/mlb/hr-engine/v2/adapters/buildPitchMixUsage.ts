import {
  getPitchMixMapResult,
  type StatcastPitchMixRow,
} from "../../../statcastClient";
import type { PitchMixUsage, PitchTypeKey } from "../types";

export type BuildPitchMixUsageResult = {
  pitchMixUsage: PitchMixUsage | null;
  feedStatus: "ok" | "unavailable";
  warnings: string[];
};

const EMPTY_USAGE: PitchMixUsage = {
  four_seam: 0,
  sinker: 0,
  cutter: 0,
  slider: 0,
  curve: 0,
  changeup: 0,
};

function normalizePitchType(value: string): PitchTypeKey | null {
  const key = value.trim().toLowerCase();

  if (["ff", "fa", "four-seam", "4-seam fastball", "4-seam fb", "fourseam"].includes(key)) {
    return "four_seam";
  }

  if (["si", "ft", "sinker", "2-seam fastball", "two-seam", "2-seam fb"].includes(key)) {
    return "sinker";
  }

  if (["fc", "cutter", "cut fastball"].includes(key)) {
    return "cutter";
  }

  if (["sl", "slider", "sweeper", "sweep"].includes(key)) {
    return "slider";
  }

  if (["cu", "kc", "curve", "curveball", "knuckle curve"].includes(key)) {
    return "curve";
  }

  if (["ch", "fs", "fo", "changeup", "split-finger", "splitter", "forkball"].includes(key)) {
    return "changeup";
  }

  return null;
}

function buildUsageFromRows(rows: StatcastPitchMixRow[]): PitchMixUsage | null {
  const usage: PitchMixUsage = { ...EMPTY_USAGE };
  let matchedUsage = 0;

  for (const row of rows) {
    const normalized = normalizePitchType(row.pitchType || row.pitchName || "");
    if (!normalized) continue;

    const pitchUsage = Number.isFinite(row.pitchUsage) ? Number(row.pitchUsage) : 0;
    usage[normalized] += pitchUsage;
    matchedUsage += pitchUsage;
  }

  if (matchedUsage <= 0) {
    return null;
  }

  const normalizedUsage: PitchMixUsage = { ...EMPTY_USAGE };
  for (const key of Object.keys(usage) as PitchTypeKey[]) {
    normalizedUsage[key] = usage[key] / matchedUsage;
  }

  return normalizedUsage;
}

export async function buildPitchMixUsage(
  pitcherId: number,
  year?: number,
): Promise<BuildPitchMixUsageResult> {
  const { map, feedStatus, errorMessage } = await getPitchMixMapResult(year);

  if (feedStatus !== "ok") {
    return {
      pitchMixUsage: null,
      feedStatus,
      warnings: [
        errorMessage
          ? `Pitch mix feed unavailable: ${errorMessage}`
          : "Pitch mix feed unavailable.",
      ],
    };
  }

  const rows = map[pitcherId] ?? [];
  if (rows.length === 0) {
    return {
      pitchMixUsage: null,
      feedStatus,
      warnings: ["No Statcast pitch mix found for pitcher."],
    };
  }

  const pitchMixUsage = buildUsageFromRows(rows);
  if (!pitchMixUsage) {
    return {
      pitchMixUsage: null,
      feedStatus,
      warnings: ["Statcast pitch mix rows did not map to supported pitch groups."],
    };
  }

  const unsupportedCount = rows.filter(
    (row) => !normalizePitchType(row.pitchType || row.pitchName || ""),
  ).length;

  const warnings =
    unsupportedCount > 0
      ? [`Ignored ${unsupportedCount} unsupported pitch-type rows while building pitch mix.`]
      : [];

  return {
    pitchMixUsage,
    feedStatus,
    warnings,
  };
}

export const __pitchMixTestUtils = {
  normalizePitchType,
  buildUsageFromRows,
};
