/** NFL data routes — stub until a free stats provider is wired. */
import type { Express, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import { buildApiMeta } from "../lib/apiResponseMeta";
import type { RequestWithContext } from "../middleware/requestContext";

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
        dataQuality: "unavailable",
        warnings: [NFL_NOT_READY],
      }),
    }));
  };

  app.get("/api/nfl/lineup/today", asyncHandler(stubHandler));
  app.get("/api/nfl/edge-board/today", asyncHandler(stubHandler));
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
