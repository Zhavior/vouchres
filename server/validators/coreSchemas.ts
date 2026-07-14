import { z } from "zod";
import { PickStatusSchema } from "./pickSchemas";
import { isValidJurisdictionCode, normalizeJurisdictionCode } from "../lib/jurisdictionPolicy";

export const BetaSignupSchema = z.object({
  email: z.string().trim().email().max(254),
});

export const LegalConfirmSchema = z.object({
  age_confirmed: z.literal(true),
  jurisdiction: z
    .string()
    .trim()
    .min(2)
    .max(10)
    .transform(normalizeJurisdictionCode)
    .refine(isValidJurisdictionCode, "Jurisdiction must use ISO-like codes (e.g. US-NV, CA)."),
});

export const GradePickSchema = z.object({
  pick_id: z.string().uuid(),
  status: PickStatusSchema.exclude(["pending"]),
  settled_units: z.number().finite().nullable().optional(),
  learning_note: z.string().trim().max(4000).optional(),
});

export type BetaSignupInput = z.infer<typeof BetaSignupSchema>;
export type LegalConfirmInput = z.infer<typeof LegalConfirmSchema>;
export type GradePickInput = z.infer<typeof GradePickSchema>;

