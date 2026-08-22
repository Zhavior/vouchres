/** NFL data routes — V2 is source-backed and fails closed until a licensed provider is configured. */
import type { Express, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import { buildApiMeta } from "../lib/apiResponseMeta";
import type { RequestWithContext } from "../middleware/requestContext";
import { fetchNflTouchdownIntelligence } from "../services/nfl/nflEspnService";
import { getTdBoardV2 } from "../services/hubs/tdBoardHub";
import { getSportsDataIoTdProviderStatus } from "../services/nfl/providers/sportsDataIoProvider";

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

  app.get("/api/nfl/td-board/v2", asyncHandler(async (req: RequestWithContext, res: Response) => {
    if (process.env.TD_BOARD_V2_ENABLED === "false") {
      return res.status(503).json({
        success: false,
        error: "td_board_v2_disabled",
        message: "TD Board V2 is disabled by configuration.",
      });
    }

    const date = typeof req.query.date === "string"
      ? req.query.date
      : new Intl.DateTimeFormat("en-CA", { timeZone: "America/Halifax" }).format(new Date());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, error: "invalid_date", message: "date must use YYYY-MM-DD" });
    }

    const rawLimit = typeof req.query.limit === "string" ? Number(req.query.limit) : 48;
    if (!Number.isFinite(rawLimit) || rawLimit < 1) {
      return res.status(400).json({ success: false, error: "invalid_limit", message: "limit must be a positive number" });
    }

    const board = await getTdBoardV2({
      date,
      cursor: typeof req.query.cursor === "string" ? req.query.cursor : undefined,
      limit: rawLimit,
    });
    res.setHeader("Cache-Control", "private, max-age=15, stale-while-revalidate=45");
    return res.json({ success: true, ...board });
  }));
  
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
    return res.json({
      success: true,
      status: "awaiting_verified_snapshots",
      data: [],
      warnings: ["The TD outcome ledger stays empty until source-backed predictions and completed outcomes are stored."],
    });
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
    const provider = getSportsDataIoTdProviderStatus();
    return res.json(apiOkFlat(req, {
      sport: "nfl",
      status: provider.configured ? "ready" : "not_configured",
      provider: provider.provider,
      capabilities: {
        lineup: provider.capabilities.depth_charts,
        edgeBoard: provider.configured,
        liveProgress: false,
        grading: false,
      },
      warnings: provider.warning ? [provider.warning] : [],
    }));
  }));
}
