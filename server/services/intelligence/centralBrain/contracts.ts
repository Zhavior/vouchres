import type { z } from "zod";
import type {
  CentralBrainDecisionSchema,
  CentralBrainEvidenceSchema,
  CentralBrainQualitySchema,
  CentralBrainSnapshotSchema,
  CentralBrainSportSchema,
} from "./schemas";

export type CentralBrainSport = z.infer<typeof CentralBrainSportSchema>;
export type CentralBrainQuality = z.infer<typeof CentralBrainQualitySchema>;
export type CentralBrainEvidence = z.infer<typeof CentralBrainEvidenceSchema>;
export type CentralBrainDecision = z.infer<typeof CentralBrainDecisionSchema>;
export type CentralBrainSnapshot = z.infer<typeof CentralBrainSnapshotSchema>;

export interface CentralBrainAdapter<TInput = unknown> {
  sport: CentralBrainSport;
  engineVersion: string;
  build(input: TInput): Promise<Omit<CentralBrainSnapshot, "schemaVersion" | "engineVersion" | "sport" | "agent">>;
}

export type CentralBrainNarrator = (
  snapshot: Readonly<CentralBrainSnapshot>,
) => Promise<string | null>;
