import { z } from "zod";

const UuidLike = z.string().trim().min(1).max(64);
const YmdSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD.");

const noBodyToEmptyObject = (value: unknown) => value == null ? {} : value;

export const EmptyBodySchema = z.preprocess(noBodyToEmptyObject, z.object({}).strict());

export const DateOnlyBodySchema = z.preprocess(
  noBodyToEmptyObject,
  z.object({ date: YmdSchema.optional() }).strict(),
);

export const GenericJsonObjectBodySchema = z
  .record(z.string().max(80), z.unknown())
  .superRefine((value, ctx) => {
    const bytes = Buffer.byteLength(JSON.stringify(value), "utf8");
    if (bytes > 16_000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Payload must be 16000 bytes or less.",
      });
    }
  });

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

export const PushSubscriptionSchema = z
  .object({
    endpoint: z.string().trim().url().max(2048),
    expirationTime: z.union([z.number().int().nonnegative(), z.null()]).optional(),
    keys: z
      .object({
        p256dh: z.string().trim().min(1).max(512),
        auth: z.string().trim().min(1).max(256),
      })
      .strict(),
  })
  .strict();

export const PlayerVouchToggleSchema = z
  .object({
    player_id: z.union([z.string().trim().min(1).max(80), z.number().int().positive()]),
    player_name: z.string().trim().min(1).max(120),
    team: z.string().trim().max(80).nullable().optional(),
    opponent: z.string().trim().max(80).nullable().optional(),
    game_pk: z.union([z.string().trim().min(1).max(40), z.number().int().positive()]).nullable().optional(),
    context_date: YmdSchema.nullable().optional(),
    source_page: z.string().trim().max(120).nullable().optional(),
  })
  .strict();

export const ResultGradeSchema = z
  .object({
    pickId: z.string().trim().min(1).max(120),
    result: z.enum(["win", "won", "loss", "lost", "push", "void"]),
    whatActuallyHappened: z.string().trim().max(2000).optional(),
  })
  .strict();

export const AiJudgeSocialDraftGenerateSchema = z
  .object({
    date: YmdSchema.optional(),
    scheduledFor: z.string().trim().datetime({ offset: true }).optional(),
  })
  .strict();
