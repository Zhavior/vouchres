import { Router } from "express";
import type { Response } from "express";
import { AppError } from "../errors/AppError";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import type { RequestWithContext } from "../middleware/requestContext";
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
import { getPlayerEdgeResearch } from "../services/mlb/playerEdgeResearchService";

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

playerRegistryRoutes.get("/mlb/players/count", asyncHandler(async (req: RequestWithContext, res: Response) => {
  try {
    const count = await getPlayerCount();
    return res.json(apiOkFlat(req, count as Record<string, unknown>));
  } catch (error) {
    throw registryUnavailable(error);
  }
}));

playerRegistryRoutes.get("/mlb/players/registry", asyncHandler(async (req: RequestWithContext, res: Response) => {
  try {
    const players = await getPlayerRegistry();
    return res.json(apiOkFlat(req, {
      count: players.length,
      players,
      dataSource: "official_mlb",
      updatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    throw registryUnavailable(error);
  }
}));

playerRegistryRoutes.get("/mlb/players/active", asyncHandler(async (req: RequestWithContext, res: Response) => {
  try {
    const players = await getActivePlayers();
    return res.json(apiOkFlat(req, {
      count: players.length,
      players,
      dataSource: "official_mlb",
      updatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    throw registryUnavailable(error);
  }
}));

playerRegistryRoutes.get("/mlb/players/search", asyncHandler(async (req: RequestWithContext, res: Response) => {
  try {
    const q = queryString(req.query.q, 80);
    const players = await searchPlayers(q);
    return res.json(apiOkFlat(req, {
      query: q,
      count: players.length,
      players,
      dataSource: "official_mlb",
      updatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    throw registryUnavailable(error);
  }
}));

playerRegistryRoutes.get("/mlb/players/:playerId/edge-research", asyncHandler(async (req: RequestWithContext, res: Response) => {
  try {
    const playerId = positiveInt(req.params.playerId, "playerId");
    const pitcherRaw = queryString(req.query.pitcherId, 12);
    const opponentAbbr = queryString(req.query.opponent, 6);
    const gamePkRaw = queryString(req.query.gamePk, 12);
    const pitcherId = pitcherRaw ? positiveInt(pitcherRaw, "pitcherId") : undefined;
    const gamePk = gamePkRaw ? positiveInt(gamePkRaw, "gamePk") : undefined;

    const research = await getPlayerEdgeResearch(playerId, {
      pitcherId,
      opponentAbbr: opponentAbbr || undefined,
      gamePk,
    });

    return res.json(apiOkFlat(req, research as Record<string, unknown>));
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw registryUnavailable(error);
  }
}));

playerRegistryRoutes.get("/mlb/players/:playerId", asyncHandler(async (req: RequestWithContext, res: Response) => {
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
    return res.json(apiOkFlat(req, { player, dataSource: "official_mlb", updatedAt: new Date().toISOString() }));
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw registryUnavailable(error);
  }
}));

playerRegistryRoutes.post("/mlb/players/refresh", requireAuth, requireStaff, generationLimiter, asyncHandler(async (req: RequestWithContext, res: Response) => {
  try {
    const result = await refreshPlayerRegistry();
    return res.json(apiOkFlat(req, {
      count: result.count,
      players: result.players,
      dataSource: "official_mlb",
      updatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    throw registryUnavailable(error);
  }
}));
