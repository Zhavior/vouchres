import { Router } from "express";
import type { Request, Response } from "express";
import { getFeedComposerOptions } from "../services/feed/composerOptionsService";

export const feedRoutes = Router();

feedRoutes.get("/feed/composer-options", async (req: Request, res: Response) => {
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
    return res.status(503).json({
      sport: "MLB",
      date: date ?? new Date().toISOString().slice(0, 10),
      games: [],
      markets: [
        { id: "HR", label: "Home Run" },
        { id: "HIT", label: "Hit" },
        { id: "RBI", label: "RBI" },
        { id: "RUN", label: "Run" },
        { id: "TB", label: "Total Bases" },
        { id: "K", label: "Strikeouts" },
        { id: "CUSTOM", label: "Custom Read" },
      ],
      warnings: [err?.message ?? "Composer options unavailable"],
    });
  }
});

