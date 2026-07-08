import { z } from "zod";

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
    }).passthrough(),
    splits: z.object({
      vRHP: PlayerSplitSchema,
      vLHP: PlayerSplitSchema,
      home: PlayerSplitSchema,
      last10: PlayerSplitSchema,
      away: PlayerSplitSchema.optional(),
    }),
  })
  .passthrough();

export const PlayerResearchRequestSchema = z.object({
  playerData: PlayerResearchDataSchema,
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
  .passthrough();

export const ParlayEdgeRequestSchema = z.object({
  legs: z.array(ParlayEdgeLegSchema).min(1, "At least one leg is required.").max(12, "Max 12 legs."),
});

export type ParlayEdgeInput = z.infer<typeof ParlayEdgeRequestSchema>;
export type AiChatInput = z.infer<typeof AiChatRequestSchema>;
export type AiImageInput = z.infer<typeof AiImageRequestSchema>;
export type AiThemeInput = z.infer<typeof AiThemeRequestSchema>;
export type PlayerResearchInput = z.infer<typeof PlayerResearchRequestSchema>;
