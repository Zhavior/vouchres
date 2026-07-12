import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const ParlayIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const ListParlaysQuerySchema = z.object({
  user_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const UpdateParlaySchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  stake_units: z.number().positive().optional(),
});

const FakeGeneratedIdPrefixes = ["leg-", "ai-leg-"];

const isFakeLegacyGeneratedId = (value: unknown): boolean => {
  if (value == null) return false;
  const text = String(value).trim().toLowerCase();
  return FakeGeneratedIdPrefixes.some((prefix) => text.startsWith(prefix));
};

export const SaveMeParlayLegSchema = z
  .object({
    id: z.string().optional(),
    event_id: z.union([z.string(), z.number()]).optional(),
    eventId: z.union([z.string(), z.number()]).optional(),
    game_id: z.union([z.string(), z.number()]).optional(),
    gameId: z.union([z.string(), z.number()]).optional(),
    gamePk: z.union([z.string(), z.number()]).optional(),
    game_pk: z.union([z.string(), z.number()]).optional(),
    game: z.union([z.string(), z.number()]).optional(),
    team_id: z.union([z.string(), z.number()]).optional(),
    teamId: z.union([z.string(), z.number()]).optional(),
    player_id: z.union([z.string(), z.number()]).nullable().optional(),
    playerId: z.union([z.string(), z.number()]).nullable().optional(),
    mlbPlayerId: z.union([z.string(), z.number()]).nullable().optional(),
    mlb_player_id: z.union([z.string(), z.number()]).nullable().optional(),
    personId: z.union([z.string(), z.number()]).nullable().optional(),
    market: z.string().optional(),
    market_code: z.string().optional(),
    marketCode: z.string().optional(),
    selection: z.string().optional(),
    playerName: z.string().optional(),
    odds: z.union([z.number().finite(), z.string()]).nullable().optional(),
    odds_decimal: z.number().finite().nullable().optional(),
    oddsDecimal: z.number().finite().nullable().optional(),
    stat_target: z.union([z.number().finite(), z.string()]).nullable().optional(),
    statTarget: z.union([z.number().finite(), z.string()]).nullable().optional(),
    comparator: z.string().optional(),
    external_provider: z.string().optional(),
    externalProvider: z.string().optional(),
  })
  .passthrough()
  .superRefine((leg, ctx) => {
    const odds = leg.odds ?? leg.odds_decimal ?? leg.oddsDecimal;
    if (odds !== undefined && odds !== null && !Number.isFinite(Number(odds))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["odds"], message: "Leg odds must be numeric." });
    }

    const identityCandidates = [
      leg.event_id,
      leg.eventId,
      leg.game_id,
      leg.gameId,
      leg.gamePk,
      leg.game_pk,
      leg.game,
    ];

    if (identityCandidates.some(isFakeLegacyGeneratedId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["event_id"],
        message: "Fake generated leg IDs cannot be saved. Rebuild this parlay with canonical MLB game/player identity.",
      });
    }
  });

export const SaveMeParlaySchema = z
  .object({
    id: z.string().max(200).optional(),
    title: z.string().max(200).optional(),
    mode: z.enum(["REAL", "PRACTICE"]).optional(),
    source: z.string().max(80).optional(),
    status: z.enum(["pending", "live", "won", "lost", "void", "partially_void", "cancelled"]).optional(),
    sport: z.string().max(32).optional(),
    wagerAmount: z.number().finite().min(0).max(100000).optional(),
    stake_units: z.number().finite().min(0).max(100000).optional(),
    edgeScore: z.number().finite().nullable().optional(),
    confidence: z.number().finite().nullable().optional(),
    explanation: z.string().max(2000).optional(),
    aiGenerated: z.boolean().optional(),
    clientRef: z.string().max(200).optional(),
    client_ref: z.string().max(200).optional(),
    legs: z.array(SaveMeParlayLegSchema).min(1, "At least 1 leg is required.").max(12, "Max 12 legs."),
  })
  .passthrough();

const requiredTrimmedString = (field: string, max = 280) =>
  z.preprocess(
    (value) => (typeof value === "number" ? String(value) : value),
    z.string().trim().min(1, `${field} is required.`).max(max)
  );

export const GradeParlayLegSchema = z
  .object({
    sport: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.enum(["mlb", "nba", "nfl"])),
    gamePk: requiredTrimmedString("gamePk", 64),
    market: z.string().trim().toLowerCase().min(1, "market is required.").max(80),
    selection: requiredTrimmedString("selection", 280),
    threshold: z.coerce.number().finite().optional(),
    oddsDecimal: z.coerce.number().finite().gt(1).max(10000).optional(),
  })
  .passthrough();

export const GradeParlaySchema = z.object({
  legs: z.array(GradeParlayLegSchema).min(1, "legs must include at least 1 item.").max(12, "legs must include at most 12 items."),
  stakeUnits: z.coerce.number().finite().positive().max(100000).default(1),
});

export const GradeParlayResponseSchema = z.object({
  ok: z.literal(true),
  legs: z.array(z.object({
    sport: z.enum(["mlb", "nba", "nfl"]),
    gamePk: z.string(),
    market: z.string(),
    selection: z.string(),
    oddsDecimal: z.number().nullable(),
    status: z.enum(["won", "lost", "push", "pending", "error"]),
    actual: z.number().nullable(),
    note: z.string().nullable(),
  })),
  parlay: z.object({
    status: z.enum(["won", "lost", "push", "pending", "error"]),
    settledUnits: z.number().nullable(),
    combinedOdds: z.number().nullable(),
    note: z.string(),
  }),
  gradedAt: z.string().datetime(),
  meta: z.object({
    requestId: z.string(),
    timestamp: z.string().datetime(),
  }).passthrough(),
});

export const ParlayLegProgressRequestSchema = z.object({
  legs: z.array(z.object({
    id: z.string().trim().min(1).max(160),
    gamePk: z.coerce.string().trim().regex(/^\d{5,10}$/, "gamePk must be a numeric league game id."),
    playerId: z.union([z.string().trim().regex(/^\d{1,12}$/, "playerId must be numeric."), z.number().int().positive()]),
    marketCode: z.string().trim().min(1).max(64),
    statTarget: z.coerce.number().finite().positive().max(100).default(1),
  })).min(1, "legs must include at least 1 item.").max(50, "legs must include at most 50 items."),
});

export type ListParlaysQuery = z.infer<typeof ListParlaysQuerySchema>;
export type UpdateParlayInput = z.infer<typeof UpdateParlaySchema>;
export type SaveMeParlayInput = z.infer<typeof SaveMeParlaySchema>;
export type GradeParlayInput = z.infer<typeof GradeParlaySchema>;
export type GradeParlayResponse = z.infer<typeof GradeParlayResponseSchema>;
export type ParlayLegProgressRequest = z.infer<typeof ParlayLegProgressRequestSchema>;
