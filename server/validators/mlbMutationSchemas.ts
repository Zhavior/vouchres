import { z } from "zod";

const MlbLegProgressSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  gamePk: z.union([z.string(), z.number()]),
  game_pk: z.union([z.string(), z.number()]).optional(),
  playerId: z.union([z.string(), z.number()]).optional(),
  player_id: z.union([z.string(), z.number()]).optional(),
  marketCode: z.string().trim().max(64).optional().nullable(),
  market_code: z.string().trim().max(64).optional().nullable(),
  statTarget: z.coerce.number().finite().optional(),
  stat_target: z.coerce.number().finite().optional(),
});

export const ParlayLegProgressSchema = z.object({
  legs: z.array(MlbLegProgressSchema).min(1).max(10),
});

const playerNameField = z
  .object({
    playerName: z.string().trim().min(1).max(120).optional(),
    player_name: z.string().trim().min(1).max(120).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.playerName && !value.player_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "playerName is required.",
        path: ["playerName"],
      });
    }
  });

export const ParlayTierOddsSchema = playerNameField.and(z.object({
  teamName: z.string().trim().max(80).optional().nullable(),
  team_name: z.string().trim().max(80).optional().nullable(),
  homeTeam: z.string().trim().max(80).optional().nullable(),
  home_team: z.string().trim().max(80).optional().nullable(),
  awayTeam: z.string().trim().max(80).optional().nullable(),
  away_team: z.string().trim().max(80).optional().nullable(),
  marketCode: z.string().trim().max(64).optional().nullable(),
  market_code: z.string().trim().max(64).optional().nullable(),
  statTarget: z.coerce.number().finite().optional(),
  stat_target: z.coerce.number().finite().optional(),
}));

const TierBatchItemSchema = z.object({
  key: z.union([z.string(), z.number()]).optional(),
  id: z.union([z.string(), z.number()]).optional(),
  marketCode: z.string().trim().max(64).optional().nullable(),
  market_code: z.string().trim().max(64).optional().nullable(),
  statTarget: z.coerce.number().finite().optional(),
  stat_target: z.coerce.number().finite().optional(),
});

export const ParlayTierOddsBatchSchema = playerNameField.and(z.object({
  teamName: z.string().trim().max(80).optional().nullable(),
  team_name: z.string().trim().max(80).optional().nullable(),
  homeTeam: z.string().trim().max(80).optional().nullable(),
  home_team: z.string().trim().max(80).optional().nullable(),
  awayTeam: z.string().trim().max(80).optional().nullable(),
  away_team: z.string().trim().max(80).optional().nullable(),
  tiers: z.array(TierBatchItemSchema).min(1).max(12),
}));
