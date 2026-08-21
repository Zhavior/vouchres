/** NFL data routes — stub until a free stats provider is wired. */
import type { Express, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import { buildApiMeta } from "../lib/apiResponseMeta";
import type { RequestWithContext } from "../middleware/requestContext";
import { fetchNflTouchdownIntelligence } from "../services/nfl/nflEspnService";

const NFL_NOT_READY = "NFL data endpoints are not live yet — register a stats provider and flip SPORTS.nfl.enabled.";

export function registerNflRoutes(app: Express): void {
  const stubHandler = async (req: RequestWithContext, res: Response) => {
    return res.status(503).json(apiOkFlat(req, {
      status: "not_ready",
      date: new Date().toISOString().slice(0, 10),
      games: [],
      candidates: [],
      projectedCandidates: [],
      warnings: [NFL_NOT_READY],
      meta: buildApiMeta({
        source: "nfl_stub",
        dataQuality: "limited",
        warnings: [NFL_NOT_READY],
      }),
    }));
  };

  app.get("/api/nfl/lineup/today", asyncHandler(stubHandler));
  app.get("/api/nfl/edge-board/today", asyncHandler(stubHandler));
  
  // NFL Touchdown Intelligence
  app.get("/api/nfl/touchdown-intelligence/today", asyncHandler(async (req: RequestWithContext, res: Response) => {
    try {
      const data = await fetchNflTouchdownIntelligence();
      return res.json(apiOkFlat(req, {
        date: new Date().toISOString().slice(0, 10),
        games: data,
        meta: buildApiMeta({
          source: "espn_nfl",
          dataQuality: "live",
        }),
      }));
    } catch (error) {
      console.error("Error fetching NFL touchdown intelligence:", error);
      return res.status(500).json({ error: "Failed to fetch NFL intelligence" });
    }
  }));

  app.get("/api/nfl/gateway/status", asyncHandler(async (req: RequestWithContext, res: Response) => {
    return res.json(apiOkFlat(req, {
      sport: "nfl",
      status: "not_ready",
      capabilities: {
        lineup: false,
        edgeBoard: false,
        liveProgress: false,
        grading: false,
      },
      warnings: [NFL_NOT_READY],
    }));
  }));
}
