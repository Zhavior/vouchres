import { z } from "zod";

const UuidLike = z.string().trim().min(1).max(64);

export const FollowCreateSchema = z
  .object({
    following_profile_id: UuidLike.optional().nullable(),
    following_capper_id: UuidLike.optional().nullable(),
    relationship_type: z.enum(["follow", "tail", "subscribe"]).default("follow"),
    notify_enabled: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    const profileId = value.following_profile_id ?? null;
    const capperId = value.following_capper_id ?? null;
    if (!profileId && !capperId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Must specify following_profile_id or following_capper_id.",
        path: ["following_profile_id"],
      });
    }
    if (profileId && capperId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only one follow target is allowed.",
        path: ["following_capper_id"],
      });
    }
  });

export const FollowDeleteSchema = z
  .object({
    following_profile_id: UuidLike.optional().nullable(),
    following_capper_id: UuidLike.optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (!value.following_profile_id && !value.following_capper_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Must specify following_profile_id or following_capper_id.",
        path: ["following_profile_id"],
      });
    }
  });

export const NotificationPreferencesPatchSchema = z
  .object({
    in_app_enabled: z.boolean().optional(),
    hr_alerts_enabled: z.boolean().optional(),
    parlay_alerts_enabled: z.boolean().optional(),
    follow_alerts_enabled: z.boolean().optional(),
    tail_alerts_enabled: z.boolean().optional(),
    browser_push_enabled: z.boolean().optional(),
  })
  .strict();

export const PrivacyDeleteAccountSchema = z.object({
  confirm: z.literal("DELETE MY ACCOUNT"),
});

export const AiLearningNoteSchema = z.object({
  pickId: z.string().trim().min(1).max(120),
  result: z.enum(["win", "loss", "push"]),
  originalLogic: z.string().trim().max(8000).optional().default(""),
  whatActuallyHappened: z.string().trim().max(8000).optional(),
});
