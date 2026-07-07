import { Router } from "express";
import type { Request, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { upstreamUnavailable } from "../lib/requestValidators";
import { getFeedComposerOptions } from "../services/feed/composerOptionsService";

export const feedRoutes = Router();

feedRoutes.get("/feed/composer-options", asyncHandler(async (req: Request, res: Response) => {
  const start = Date.now();
  const sport = typeof req.query.sport === "string" ? req.query.sport : "MLB";
  const date = typeof req.query.date === "string" ? req.query.date : undefined;

  try {
    const options = await getFeedComposerOptions({ sport, date });
    const playerCount = options.games.reduce(
      (sum, game) => sum + game.awayTeam.players.length + game.homeTeam.players.length,
      0
    );
    console.log(
      `[endpoint] GET /api/feed/composer-options ${Date.now() - start}ms games=${options.games.length} players=${playerCount}`
    );
    return res.json(options);
  } catch (err: any) {
    console.error("[feedRoutes] composer-options failed", err?.message);
    throw upstreamUnavailable("Composer options unavailable.", err);
  }
}));
