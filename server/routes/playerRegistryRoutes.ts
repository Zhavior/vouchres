import { Router } from "express";
import type { Response } from "express";
import { AppError } from "../errors/AppError";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import type { RequestWithContext } from "../middleware/requestContext";
import { positiveInt, upstreamUnavailable } from "../lib/requestValidators";
import { requireAuth, requireStaff } from "../middleware/auth";
import { generationLimiter, mlbReadLimiter } from "../middleware/rateLimit";
import { buildApiMeta } from "../lib/apiResponseMeta";
import {
  getActivePlayers,
  getPlayerById,
  getPlayerCount,
  getPlayerRegistryPayload,
  refreshPlayerRegistry,
  searchPlayers,
} from "../services/mlb/playerRegistryService";
import { getPlayerEdgeResearch } from "../services/mlb/playerEdgeResearchService";
import { getPitcherResearch } from "../services/mlb/pitcherResearchService";

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
    const status = await getPlayerCount();
    return res.json(apiOkFlat(req, status as unknown as Record<string, unknown>));
  } catch (error) {
    throw registryUnavailable(error);
  }
}));

playerRegistryRoutes.get("/mlb/players/registry", asyncHandler(async (req: RequestWithContext, res: Response) => {
  try {
    const payload = await getPlayerRegistryPayload();
    return res.json(apiOkFlat(req, payload as unknown as Record<string, unknown>));
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

playerRegistryRoutes.get("/mlb/players/:playerId/edge-research", mlbReadLimiter, asyncHandler(async (req: RequestWithContext, res: Response) => {
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

    res.setHeader("Cache-Control", "private, max-age=60, stale-while-revalidate=300");
    return res.json(apiOkFlat(req, {
      ...research,
      meta: buildApiMeta({
        source: "official_mlb_statsapi_statcast",
        dataQuality: research.warnings.length > 0 ? "limited" : "official_mlb_player_research",
        updatedAt: research.updatedAt,
        warnings: research.warnings,
        cache: {
          strategy: "player_edge_research_upstream_cache",
          ttlMs: 60_000,
          asOf: research.updatedAt,
        },
      }),
    }));
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw registryUnavailable(error);
  }
}));

playerRegistryRoutes.get("/mlb/players/:playerId/pitcher-research", mlbReadLimiter, asyncHandler(async (req: RequestWithContext, res: Response) => {
  try {
    const playerId = positiveInt(req.params.playerId, "playerId");
    const research = await getPitcherResearch(playerId);

    res.setHeader("Cache-Control", "private, max-age=60, stale-while-revalidate=300");
    return res.json(apiOkFlat(req, {
      ...research,
      meta: buildApiMeta({
        source: "official_mlb_statsapi_statcast",
        dataQuality: research.warnings.length > 0 ? "limited" : "official_mlb_player_research",
        updatedAt: research.updatedAt,
        warnings: research.warnings,
        cache: {
          strategy: "pitcher_research_upstream_cache",
          ttlMs: 60_000,
          asOf: research.updatedAt,
        },
      }),
    }));
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
