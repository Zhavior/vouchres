import type { HRScoreInput } from "../engine/hrScoreEngine";
import type { EngineEvidenceInput } from "../../../lib/aurora/contracts/engineEvidenceInput";
import { buildEngineEvidence } from "../../../lib/aurora/builders/buildEngineEvidence";

export function hrAuroraAdapter(
  input: HRScoreInput
): EngineEvidenceInput {
  return {
  barrelRate: input.barrelRate,
  hardHitRate: input.hardHitRate,
  pitcherHR9: input.pitcherHR9,
  parkFactor: input.parkFactor,
  weatherBoost: input.weatherBoost,
  recentForm: input.recentForm,
  matchupEdge: input.matchupEdge,
};
}
