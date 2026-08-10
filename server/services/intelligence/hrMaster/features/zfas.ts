import type { BatterProfile, PitchMixUsage, StartingPitcherProfile } from "../types";
import { HR_MASTER_MODEL } from "../modelConfig";
import { clampToUnitScale, normalizeMinMax } from "../normalize";

const PITCH_KEYS = [
  ["four_seam", "xwOBA_vs_4seam", "sample_4seam"],
  ["sinker", "xwOBA_vs_sinker", "sample_sinker"],
  ["cutter", "xwOBA_vs_cutter", "sample_cutter"],
  ["slider", "xwOBA_vs_slider", "sample_slider"],
  ["curve", "xwOBA_vs_curve", "sample_curve"],
  ["changeup", "xwOBA_vs_changeup", "sample_changeup"],
] as const;

const LEAGUE_XWOBA = 0.340;
const SHRINKAGE_K = 50;

function shrunkXwOBA(observed: number | undefined, sample: number | undefined, handedness: string): number {
  const obs = observed ?? LEAGUE_XWOBA;
  const n = sample ?? 0;
  const baseline = handedness === "L" ? LEAGUE_XWOBA + 0.008 : LEAGUE_XWOBA;
  if (n <= 0) return baseline;
  return (n * obs + SHRINKAGE_K * baseline) / (n + SHRINKAGE_K);
}

function platoonModifier(batter: BatterProfile, pitcher: StartingPitcherProfile): number {
  const favorable =
    (batter.handedness === "L" && pitcher.handedness === "R") ||
    (batter.handedness === "R" && pitcher.handedness === "L");
  if (favorable && batter.split_profile.platoon_split_delta > 0) return 1.10;
  return 1.0;
}

function starterExposureModifier(projectedInnings: number, lineupSpot: number): number {
  const exposure = Math.min(1, projectedInnings / 6) * (1 - (lineupSpot - 1) * 0.04);
  return clampToUnitScale(0.55 + exposure * 0.45);
}

export function computeZfas(
  batter: BatterProfile,
  pitcher: StartingPitcherProfile,
): { normalized: number; breakdown: Record<string, number | string | boolean> } {
  const mix = pitcher.pitch_mix_usage;
  const skill = batter.pitch_type_skill;
  let pitchMatchupQuality = 0;
  let weakSample = false;

  for (const [usageKey, skillKey, sampleKey] of PITCH_KEYS) {
    const usage = mix[usageKey as keyof PitchMixUsage] ?? 0;
    const shrunk = shrunkXwOBA(
      skill[skillKey as keyof typeof skill] as number | undefined,
      skill[sampleKey as keyof typeof skill] as number | undefined,
      batter.handedness,
    );
    pitchMatchupQuality += usage * normalizeMinMax(shrunk, 0.250, 0.480);
    const sample = skill[sampleKey as keyof typeof skill] as number | undefined;
    if (sample != null && sample < HR_MASTER_MODEL.validation_thresholds.pitch_sample_min) {
      weakSample = true;
    }
  }

  const platoon = platoonModifier(batter, pitcher);
  const exposure = starterExposureModifier(pitcher.projected_innings, batter.projected_lineup_spot);
  const normalizedMix = clampToUnitScale(pitchMatchupQuality);
  const rawZfas = normalizedMix * platoon * exposure;

  return {
    normalized: clampToUnitScale(rawZfas),
    breakdown: {
      pitch_matchup_quality: normalizedMix,
      platoon_modifier: platoon,
      starter_exposure_modifier: exposure,
      weak_pitch_sample: weakSample,
      pull_side_hr_fit: batter.split_profile.pull_side_hr_fit,
    },
  };
}
