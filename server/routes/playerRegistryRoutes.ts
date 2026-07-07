import { Router } from "express";
import type { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { asyncHandler } from "../lib/asyncHandler";
import { positiveInt, upstreamUnavailable } from "../lib/requestValidators";
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

function registryUnavailable(error: unknown): AppError {
  console.error("[playerRegistryRoutes]", error);
  return upstreamUnavailable("MLB player registry is unavailable.", error);
}

function queryString(value: unknown, maxLength: number): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw == null) return "";
  const text = String(raw).trim();
  return text.slice(0, maxLength);
}

playerRegistryRoutes.get("/mlb/players/count", asyncHandler(async (_req: Request, res: Response) => {
  try {
    return res.json(await getPlayerCount());
  } catch (error) {
    throw registryUnavailable(error);
  }
}));

playerRegistryRoutes.get("/mlb/players/registry", asyncHandler(async (_req: Request, res: Response) => {
  try {
    const players = await getPlayerRegistry();
    return res.json({
      count: players.length,
      players,
      dataSource: "official_mlb",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    throw registryUnavailable(error);
  }
}));

playerRegistryRoutes.get("/mlb/players/active", asyncHandler(async (_req: Request, res: Response) => {
  try {
    const players = await getActivePlayers();
    return res.json({
      count: players.length,
      players,
      dataSource: "official_mlb",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    throw registryUnavailable(error);
  }
}));

playerRegistryRoutes.get("/mlb/players/search", asyncHandler(async (req: Request, res: Response) => {
  try {
    const q = queryString(req.query.q, 80);
    const players = await searchPlayers(q);
    return res.json({
      query: q,
      count: players.length,
      players,
      dataSource: "official_mlb",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    throw registryUnavailable(error);
  }
}));

playerRegistryRoutes.get("/mlb/players/:playerId", asyncHandler(async (req: Request, res: Response) => {
  try {
    const playerId = positiveInt(req.params.playerId, "playerId");
    const player = await getPlayerById(String(playerId));
    if (!player) {
      throw new AppError({
        status: 404,
        code: "not_found",
        message: "Player not found.",
        details: { playerId, dataSource: "official_mlb" },
      });
    }
    return res.json({ player, dataSource: "official_mlb", updatedAt: new Date().toISOString() });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw registryUnavailable(error);
  }
}));

playerRegistryRoutes.post("/mlb/players/refresh", requireAuth, requireStaff, generationLimiter, asyncHandler(async (_req: Request, res: Response) => {
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
    throw registryUnavailable(error);
  }
}));
