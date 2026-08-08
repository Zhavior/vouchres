import { z } from "zod";

const YmdSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD.");
const JsonBudget = (maxBytes: number) =>
  z.unknown().superRefine((value, ctx) => {
    const bytes = Buffer.byteLength(JSON.stringify(value ?? null), "utf8");
    if (bytes > maxBytes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Payload must be ${maxBytes} bytes or less.`,
      });
    }
  });

export const PickCandidateSchema = z
  .object({
    pickId: z.string().trim().max(120).optional(),
    player: z.string().trim().max(120).optional(),
    team: z.string().trim().max(80).optional(),
    opponent: z.string().trim().max(80).optional(),
    market: z.string().trim().min(1).max(80),
    selection: z.string().trim().max(280).optional(),
    score: z.coerce.number().finite().min(0).max(100).optional(),
    reasons: z.array(z.string().trim().max(280)).max(12).optional(),
    riskWarnings: z.array(z.string().trim().max(280)).max(12).optional(),
    isParlay: z.boolean().optional(),
    legs: z.coerce.number().int().min(1).max(12).optional(),
    dataQuality: z.enum(["full", "partial", "limited"]).optional(),
  })
  .strip();

export const AiChatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "model"]),
  content: z.string().trim().min(1).max(4000),
});

export const AiChatRequestSchema = z.object({
  messages: z.array(AiChatMessageSchema).min(1, "At least one message is required.").max(30, "Max 30 messages."),
  systemInstruction: z.string().trim().max(4000).optional(),
});

export const AiImageAspectRatioSchema = z.enum(["1:1", "3:4", "4:3", "9:16", "16:9"]);

export const AiImageRequestSchema = z.object({
  prompt: z.string().trim().min(1).max(1000).default("abstract dark modern sports UI pattern"),
  aspectRatio: AiImageAspectRatioSchema.default("1:1"),
});

export const AiThemeRequestSchema = z.object({
  prompt: z.string().trim().min(1, "Please provide a theme prompt.").max(500),
});

const StatStringSchema = z.union([z.string().trim().max(20), z.number().finite()]);

const PlayerSplitSchema = z.object({
  avg: StatStringSchema.optional(),
  obp: StatStringSchema.optional(),
  slg: StatStringSchema.optional(),
  ops: StatStringSchema,
});

export const PlayerResearchDataSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().trim().min(1).max(120),
    number: z.union([z.string(), z.number()]).optional(),
    team: z.string().trim().min(1).max(80),
    position: z.string().trim().min(1).max(80),
    injuryStatus: z.string().trim().max(120).default("Unknown"),
    injurySeverity: z.enum(["NONE", "DAY_TO_DAY", "IL_10", "IL_60"]).default("NONE"),
    seasonStats: z.object({
      avg: StatStringSchema,
      hr: StatStringSchema,
      rbi: StatStringSchema.optional(),
      ops: StatStringSchema,
      obp: StatStringSchema.optional(),
      slg: StatStringSchema.optional(),
    }),
    advanced: z.object({
      hardHitPercent: z.coerce.number().finite().min(0).max(100),
      exitVelocity: z.coerce.number().finite().min(0).max(130),
      chasePercent: z.coerce.number().finite().min(0).max(100),
      woba: z.coerce.number().finite().min(0).max(1).optional(),
      xwoba: z.coerce.number().finite().min(0).max(1).optional(),
      barrelPercent: z.coerce.number().finite().min(0).max(100).optional(),
      launchAngle: z.coerce.number().finite().min(-90).max(90).optional(),
    }).strip(),
    splits: z.object({
      vRHP: PlayerSplitSchema,
      vLHP: PlayerSplitSchema,
      home: PlayerSplitSchema,
      last10: PlayerSplitSchema,
      away: PlayerSplitSchema.optional(),
    }),
  })
  .strip();

export const PlayerResearchRequestSchema = z.object({
  playerData: PlayerResearchDataSchema,
});

export const AiExplainPickRequestSchema = z
  .object({
    pick: PickCandidateSchema,
  })
  .strict()
  .and(JsonBudget(12_000));

export const AiDailyReportRequestSchema = z
  .object({
    date: YmdSchema.optional(),
  })
  .strict();

export const JudgePickRequestSchema = z
  .object({
    pick: PickCandidateSchema,
  })
  .strict();

export const JudgeParlayRequestSchema = z
  .object({
    pick: PickCandidateSchema.optional().default({
      market: "parlay",
      isParlay: true,
    }),
    legs: z.coerce.number().int().min(1).max(12).optional(),
  })
  .strict();

export const PlayerResearchResponseSchema = z.object({
  aiScore: z.number().int().min(10).max(99),
  report: z.string().trim().min(1),
});

export const ParlayEdgeLegSchema = z
  .object({
    selection: z.string().trim().min(1).max(280),
    market: z.string().trim().min(1).max(64),
    team: z.string().trim().max(64).optional(),
    gamePk: z.union([z.string(), z.number()]).optional(),
    event_id: z.union([z.string(), z.number()]).optional(),
    playerId: z.union([z.string(), z.number()]).optional(),
    odds: z.union([z.number().finite(), z.string()]).nullable().optional(),
    odds_decimal: z.number().finite().nullable().optional(),
  })
  .strip();

export const ParlayEdgeRequestSchema = z.object({
  legs: z.array(ParlayEdgeLegSchema).min(1, "At least one leg is required.").max(12, "Max 12 legs."),
});

export const ParlayEdgeResponseSchema = z.object({
  edgeScore: z.number().int().min(40).max(95),
  report: z.string().trim().min(1),
});

export type ParlayEdgeInput = z.infer<typeof ParlayEdgeRequestSchema>;
export type ParlayEdgeResponse = z.infer<typeof ParlayEdgeResponseSchema>;
export type AiChatInput = z.infer<typeof AiChatRequestSchema>;
export type AiImageInput = z.infer<typeof AiImageRequestSchema>;
export type AiThemeInput = z.infer<typeof AiThemeRequestSchema>;
export type PlayerResearchInput = z.infer<typeof PlayerResearchRequestSchema>;
export type PlayerResearchResponse = z.infer<typeof PlayerResearchResponseSchema>;
