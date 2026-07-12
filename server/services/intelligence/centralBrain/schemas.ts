import { z } from "zod";

export const CentralBrainSportSchema = z.enum(["mlb", "nba", "nfl", "nhl"]);
export const CentralBrainQualitySchema = z.enum(["full", "partial", "limited"]);

export const CentralBrainEvidenceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  source: z.string().min(1),
  status: z.enum(["verified", "projected", "missing"]),
  observedAt: z.string().datetime().optional(),
});

export const CentralBrainDecisionSchema = z.object({
  id: z.string().min(1),
  subjectId: z.string().min(1),
  subjectLabel: z.string().min(1),
  market: z.string().min(1),
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  rank: z.number().int().positive(),
  recommendation: z.string().min(1),
  reasons: z.array(z.string()).max(12),
  risks: z.array(z.string()).max(12),
  evidence: z.array(CentralBrainEvidenceSchema).max(24),
  metadata: z.record(z.string(), z.unknown()),
});

export const CentralBrainSnapshotSchema = z.object({
  schemaVersion: z.literal("1.0"),
  engineVersion: z.string().min(1),
  sport: CentralBrainSportSchema,
  scope: z.string().min(1),
  generatedAt: z.string().datetime(),
  dataQuality: CentralBrainQualitySchema,
  decisions: z.array(CentralBrainDecisionSchema).max(500),
  warnings: z.array(z.string()).max(50),
  disclaimer: z.string().min(1),
  agent: z.object({
    id: z.literal("vouchedge-central-brain"),
    role: z.literal("explanation_only"),
    summary: z.string().min(1).max(4000),
  }).optional(),
});

export const CentralBrainDailyQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must use YYYY-MM-DD format.").optional(),
});
