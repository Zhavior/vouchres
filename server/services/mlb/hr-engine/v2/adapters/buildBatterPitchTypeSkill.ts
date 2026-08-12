import {
  getBatterPitchArsenalMapResult,
  type StatcastPitchMixRow,
} from "../../../statcastClient";
import type { PitchTypeKey, PitchTypeSkill } from "../types";
import { normalizePitchType } from "./buildPitchMixUsage";

export type BuildBatterPitchTypeSkillResult = {
  pitchTypeSkill: PitchTypeSkill | null;
  warnings: string[];
};

const SKILL_FIELD: Record<PitchTypeKey, keyof Omit<PitchTypeSkill, "sampleCounts">> = {
  four_seam: "xwOBA_vs_4seam",
  sinker: "xwOBA_vs_sinker",
  cutter: "xwOBA_vs_cutter",
  slider: "xwOBA_vs_slider",
  curve: "xwOBA_vs_curve",
  changeup: "xwOBA_vs_changeup",
};

export function buildBatterPitchTypeSkillFromRows(
  rows: StatcastPitchMixRow[],
): PitchTypeSkill | null {
  const result: PitchTypeSkill = { sampleCounts: {} };
  let matched = 0;

  for (const row of rows) {
    const pitchType = normalizePitchType(row.pitchType || row.pitchName || "");
    if (!pitchType || row.xwoba == null || !Number.isFinite(row.xwoba)) continue;

    result[SKILL_FIELD[pitchType]] = row.xwoba;
    result.sampleCounts![pitchType] = Math.max(0, row.pa ?? 0);
    matched++;
  }

  return matched > 0 ? result : null;
}

export async function buildBatterPitchTypeSkill(
  batterId: number,
  year?: number,
): Promise<BuildBatterPitchTypeSkillResult> {
  const { map, feedStatus, errorMessage } = await getBatterPitchArsenalMapResult(year);

  if (feedStatus !== "ok") {
    return {
      pitchTypeSkill: null,
      warnings: [
        errorMessage
          ? `Batter pitch-type feed unavailable: ${errorMessage}`
          : "Batter pitch-type feed unavailable.",
      ],
    };
  }

  const rows = map[batterId] ?? [];
  const pitchTypeSkill = buildBatterPitchTypeSkillFromRows(rows);

  return {
    pitchTypeSkill,
    warnings: pitchTypeSkill
      ? []
      : ["No official Statcast batter pitch-type skill rows were available."],
  };
}
