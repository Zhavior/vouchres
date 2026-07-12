import { z } from "zod";
import { CentralBrainSportSchema } from "./schemas";

export const BrainFeatureValueSchema = z.union([z.number(), z.string(), z.boolean(), z.null()]);

export const BrainFeatureEvidenceSchema = z.object({
  feature: z.string().min(1),
  source: z.string().min(1),
  status: z.enum(["verified", "projected", "missing"]),
  observedAt: z.string().datetime(),
});

export const BrainFeatureSnapshotSchema = z.object({
  schemaVersion: z.literal("1.0"),
  sport: CentralBrainSportSchema,
  market: z.string().min(1),
  eventId: z.string().min(1),
  subjectId: z.string().min(1),
  subjectLabel: z.string().min(1),
  team: z.string().min(1),
  opponent: z.string().min(1),
  observedAt: z.string().datetime(),
  scheduledAt: z.string().datetime(),
  adapterVersion: z.string().min(1),
  quality: z.enum(["full", "partial", "limited"]),
  eligibility: z.enum(["eligible", "preview", "blocked"]),
  features: z.record(z.string(), BrainFeatureValueSchema),
  missingFeatures: z.array(z.string()).max(50),
  reasons: z.array(z.string()).max(12),
  risks: z.array(z.string()).max(12),
  evidence: z.array(BrainFeatureEvidenceSchema).max(50),
});

export type BrainFeatureSnapshot = z.infer<typeof BrainFeatureSnapshotSchema>;

export interface BrainFeatureAdapter<TInput> {
  sport: z.infer<typeof CentralBrainSportSchema>;
  market: string;
  adapterVersion: string;
  build(input: TInput): Promise<BrainFeatureSnapshot[]>;
}
