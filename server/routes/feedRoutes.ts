import { Router } from "express";
import type { Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import { structuredLog } from "../lib/structuredLog";
import { upstreamUnavailable } from "../lib/requestValidators";
import { getFeedComposerOptions } from "../services/feed/composerOptionsService";
import type { RequestWithContext } from "../middleware/requestContext";

export const feedRoutes = Router();

feedRoutes.get("/feed/composer-options", asyncHandler(async (req: RequestWithContext, res: Response) => {
  const start = Date.now();
  const sport = typeof req.query.sport === "string" ? req.query.sport : "MLB";
  const date = typeof req.query.date === "string" ? req.query.date : undefined;

  const options = await getFeedComposerOptions({ sport, date }).catch((err) => {
    console.error("[feedRoutes] composer-options failed", (err as Error)?.message);
    throw upstreamUnavailable("Composer options unavailable.", err);
  });

  const playerCount = options.games.reduce(
    (sum, game) => sum + game.awayTeam.players.length + game.homeTeam.players.length,
    0,
  );
  structuredLog({
    level: "info",
    event: "endpoint",
    requestId: req.requestId,
    method: "GET",
    route: "/api/feed/composer-options",
    durationMs: Date.now() - start,
    games: options.games.length,
    players: playerCount,
  });

  return res.json(apiOkFlat(req, options as Record<string, unknown>));
}));
