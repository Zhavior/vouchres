import type { NormalizedPlayerPayload } from "@/adapters/normalized";

export interface BrainContext {
  payload: NormalizedPlayerPayload;

  hitterPower: number;
  pitcherVulnerability: number;
  parkFactor: number;
  recentForm: number;
  lineupConfidence: number;
  riskPenalty: number;
  finalScore: number;
}

export function buildBrainContext(
  payload: NormalizedPlayerPayload,
): BrainContext {
  const breakdown = payload.scoreBreakdown;

  return {
    payload,

    hitterPower: breakdown?.hitterPower ?? 0,
    pitcherVulnerability: breakdown?.pitcherVulnerability ?? 0,
    parkFactor: breakdown?.parkFactor ?? 0,
    recentForm: breakdown?.recentForm ?? 0,
    lineupConfidence: breakdown?.lineupConfidence ?? 0,
    riskPenalty: breakdown?.riskPenalty ?? 0,
    finalScore: breakdown?.finalScore ?? 0,
  };
}
