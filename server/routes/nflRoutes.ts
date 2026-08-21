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
          dataQuality: "projection_preview",
        }),
      }));
    } catch (error) {
      console.error("Error fetching NFL touchdown intelligence:", error);
      return res.status(500).json({ error: "Failed to fetch NFL intelligence" });
    }
  }));

  // NFL Touchdown Full Slate API
  app.get("/api/nfl/touchdown-slate", asyncHandler(async (req: RequestWithContext, res: Response) => {
    try {
      const { fetchNflTouchdownSlatePlayers } = await import("../services/nfl/nflEspnService");
      const players = await fetchNflTouchdownSlatePlayers();
      return res.json({
        success: true,
        totalPlayers: players.length,
        players,
      });
    } catch (error) {
      console.error("Error fetching NFL touchdown slate players:", error);
      return res.status(500).json({ success: false, error: (error as Error).message });
    }
  }));

  // NFL Historical Ledger API
  app.get("/api/nfl/ledger", asyncHandler(async (req: RequestWithContext, res: Response) => {
    try {
      const { fetchNflHistoricalLedger } = await import("../services/nfl/nflEspnService");
      const ledger = await fetchNflHistoricalLedger();
      return res.json({
        success: true,
        data: ledger,
      });
    } catch (error) {
      console.error("Error fetching NFL ledger:", error);
      return res.status(500).json({ success: false, error: (error as Error).message });
    }
  }));

  // NFL Live Red Zone Threats API
  app.get("/api/nfl/live-threats", asyncHandler(async (req: RequestWithContext, res: Response) => {
    try {
      const { fetchLiveRedZoneThreats } = await import("../services/nfl/nflEspnService");
      const threats = await fetchLiveRedZoneThreats();
      return res.json({
        success: true,
        data: threats,
      });
    } catch (error) {
      console.error("Error fetching NFL live threats:", error);
      return res.status(500).json({ success: false, error: (error as Error).message });
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
