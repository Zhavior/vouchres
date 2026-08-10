import type { BatterProfileV2, ComponentResult, PitchTypeKey, PitcherProfileV2 } from "../types";
import { clamp01, normalizeRange, safeNumber, shrinkToBaseline } from "../shared/normalize";

const PITCH_SKILL_BASELINES: Record<PitchTypeKey, number> = {
  four_seam: 0.335,
  sinker: 0.325,
  cutter: 0.31,
  slider: 0.295,
  curve: 0.285,
  changeup: 0.3,
};

function getPitchSkillValue(batter: BatterProfileV2, pitch: PitchTypeKey): number | null {
  const skill = batter.pitchTypeSkill;
  if (!skill) return null;

  switch (pitch) {
    case "four_seam":
      return skill.xwOBA_vs_4seam ?? null;
    case "sinker":
      return skill.xwOBA_vs_sinker ?? null;
    case "cutter":
      return skill.xwOBA_vs_cutter ?? null;
    case "slider":
      return skill.xwOBA_vs_slider ?? null;
    case "curve":
      return skill.xwOBA_vs_curve ?? null;
    case "changeup":
      return skill.xwOBA_vs_changeup ?? null;
  }
}

function getPitchMatchupQuality(batter: BatterProfileV2, pitcher: PitcherProfileV2): number {
  const usage = pitcher.pitchMixUsage;
  if (!usage) return 0;

  const pitches = Object.entries(usage) as Array<[PitchTypeKey, number]>;
  if (pitches.length === 0) return 0;

  let total = 0;

  for (const [pitch, pitchUsage] of pitches) {
    const observed = getPitchSkillValue(batter, pitch);
    const sampleSize = batter.pitchTypeSkill?.sampleCounts?.[pitch] ?? 0;
    const baseline = PITCH_SKILL_BASELINES[pitch];
    const shrunk = shrinkToBaseline(observed, sampleSize, baseline, 50);
    total += safeNumber(pitchUsage, 0) * shrunk;
  }

  return total;
}

function getPlatoonModifier(batter: BatterProfileV2, pitcher: PitcherProfileV2): number {
  const splitDelta = safeNumber(batter.splitProfile?.platoon_split_delta, 0);
  const favorableHandedness =
    (batter.handedness === "L" && pitcher.handedness === "R") ||
    (batter.handedness === "R" && pitcher.handedness === "L");

  return splitDelta > 0 && favorableHandedness ? 1.1 : 1;
}

function getStarterExposureModifier(batter: BatterProfileV2, pitcher: PitcherProfileV2): number {
  const projectedInnings = safeNumber(pitcher.projectedInnings, 0);
  const lineupSpot = safeNumber(batter.projectedLineupSpot, 9);
  const starterProbability = safeNumber(batter.starterProbability, 0);

  const inningsFactor = normalizeRange(projectedInnings, 3, 7, 0.5);
  const lineupFactor = clamp01(1 - (Math.max(1, lineupSpot) - 1) / 12);
  const starterFactor = clamp01(starterProbability);

  return clamp01(0.5 + inningsFactor * 0.25 + lineupFactor * 0.15 + starterFactor * 0.1);
}

export function calculateZFAS(batter: BatterProfileV2, pitcher: PitcherProfileV2): ComponentResult {
  const pitchMatchupQuality = getPitchMatchupQuality(batter, pitcher);
  const normalizedPitchMatchup = normalizeRange(pitchMatchupQuality, 0.25, 0.45, 0.5);
  const platoonModifier = getPlatoonModifier(batter, pitcher);
  const starterExposureModifier = getStarterExposureModifier(batter, pitcher);

  const rawZfas = normalizedPitchMatchup * platoonModifier * starterExposureModifier;

  return {
    value: clamp01(rawZfas),
    notes: [
      `Pitch_Matchup_Quality=${pitchMatchupQuality.toFixed(4)}`,
      `Normalized_Pitch_Matchup=${normalizedPitchMatchup.toFixed(4)}`,
      `Platoon_Modifier=${platoonModifier.toFixed(4)}`,
      `Starter_Exposure_Modifier=${starterExposureModifier.toFixed(4)}`,
      `Raw_ZFAS=${rawZfas.toFixed(4)}`,
    ],
  };
}
