import { Router } from "express";
import type { Response } from "express";
import { requireAuth, requireStaff } from "../middleware/auth";
import { generationLimiter } from "../middleware/rateLimit";
import {
  getActivePlayers,
  getPlayerById,
  getPlayerCount,
  getPlayerRegistry,
  refreshPlayerRegistry,
  searchPlayers,
} from "../services/mlb/playerRegistryService";

export const playerRegistryRoutes = Router();

function sendError(res: Response, error: unknown) {
  console.error("[playerRegistryRoutes]", error);
  return res.status(503).json({
    error: "player_registry_unavailable",
    message: error instanceof Error ? error.message : "MLB player registry is unavailable.",
    dataSource: "official_mlb",
  });
}

playerRegistryRoutes.get("/mlb/players/count", async (_req, res) => {
  try {
    return res.json(await getPlayerCount());
  } catch (error) {
    return sendError(res, error);
  }
});

playerRegistryRoutes.get("/mlb/players/registry", async (_req, res) => {
  try {
    const players = await getPlayerRegistry();
    return res.json({
      count: players.length,
      players,
      dataSource: "official_mlb",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return sendError(res, error);
  }
});

playerRegistryRoutes.get("/mlb/players/active", async (_req, res) => {
  try {
    const players = await getActivePlayers();
    return res.json({
      count: players.length,
      players,
      dataSource: "official_mlb",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return sendError(res, error);
  }
});

playerRegistryRoutes.get("/mlb/players/search", async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const players = await searchPlayers(q);
    return res.json({
      query: q,
      count: players.length,
      players,
      dataSource: "official_mlb",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return sendError(res, error);
  }
});

playerRegistryRoutes.get("/mlb/players/:playerId", async (req, res) => {
  try {
    const player = await getPlayerById(req.params.playerId);
    if (!player) {
      return res.status(404).json({
        error: "player_not_found",
        playerId: req.params.playerId,
        dataSource: "official_mlb",
      });
    }
    return res.json({ player, dataSource: "official_mlb", updatedAt: new Date().toISOString() });
  } catch (error) {
    return sendError(res, error);
  }
});

playerRegistryRoutes.post("/mlb/players/refresh", requireAuth, requireStaff, generationLimiter, async (_req, res) => {
  try {
    const result = await refreshPlayerRegistry();
    return res.json({
      ok: true,
      count: result.count,
      players: result.players,
      dataSource: "official_mlb",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return sendError(res, error);
  }
});
