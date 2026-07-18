import { z } from "zod";

export const PickStatusSchema = z.enum(["pending", "won", "lost", "push", "void", "graded_error"]);

export const CreatePickSchema = z.object({
  market: z.string().trim().min(1).max(64),
  selection: z.string().trim().min(1).max(280),
  odds_decimal: z.number().positive().max(1000).optional(),
  stake_units: z.number().positive().max(100).optional(),
  confidence: z.number().min(0).max(100).optional(),
  event_id: z.string().trim().min(1).max(64).optional(),
  leg_type: z.enum(["single", "parlay"]).default("single"),
  judge_quality: z.number().min(0).max(100).optional(),
  judge_risk: z.number().min(0).max(100).optional(),
  judge_bias: z.number().min(0).max(100).optional(),
  judge_trust: z.number().min(0).max(100).optional(),
  // judge_verdict is server/AI-authored only — accepting it from clients let users
  // set "avoid" and invert HR settle logic in gradingService.
  explanation: z.string().trim().max(4000).optional(),
});

export const ListPicksQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  user_id: z.string().uuid().optional(),
  capper_id: z.string().uuid().optional(),
  status: PickStatusSchema.optional(),
});

export type CreatePickInput = z.infer<typeof CreatePickSchema>;
export type ListPicksQuery = z.infer<typeof ListPicksQuerySchema>;

