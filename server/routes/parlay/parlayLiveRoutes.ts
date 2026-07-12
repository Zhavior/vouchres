import { Router } from "express";
import type { Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { apiOkFlat } from "../../lib/apiResponse";
import type { RequestWithContext } from "../../middleware/requestContext";
import { fetchParlayLiveProgressBySport } from "../../services/parlays/parlayLiveProgressRouter";

/** Sport-agnostic parlay live progress — dispatches by leg.sport. */
export const parlayLiveRoutes = Router();

parlayLiveRoutes.post(
  "/parlays/live-progress",
  asyncHandler(async (req: RequestWithContext, res: Response) => {
    const legs = Array.isArray(req.body?.legs) ? req.body.legs : [];
    const progress = await fetchParlayLiveProgressBySport(
      legs.map((leg: Record<string, unknown>, index: number) => ({
        id: String(leg.id ?? `leg-${index}`),
        sport: leg.sport ?? leg.sport_id ?? "mlb",
        gamePk: String(leg.gamePk ?? leg.game_pk ?? leg.gameId ?? leg.game_id ?? ""),
        playerId: leg.playerId ?? leg.player_id ?? "",
        marketCode: leg.marketCode ?? leg.market_code ?? null,
        statTarget: leg.statTarget ?? leg.stat_target ?? 1,
      })),
    );
    return res.json(apiOkFlat(req, { legs: progress }));
  }),
);
