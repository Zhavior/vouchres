import { Router, type Response } from "express";
import { AppError } from "../errors/AppError";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOk } from "../lib/apiResponse";
import { ymdOrDefault } from "../lib/requestValidators";
import { requireAuth, type AuthedRequest } from "../middleware/auth";
import type { RequestWithContext } from "../middleware/requestContext";
import { todayISO } from "../services/mlb/mlbClient";
import { structuredLog } from "../lib/structuredLog";
import {
  getMarketRadar,
  MarketRadarConfigurationError,
  MarketRadarProviderError,
} from "../services/marketRadar";

export const marketRadarRoutes = Router();

marketRadarRoutes.get(
  "/market-radar",
  requireAuth,
  asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
    const date = ymdOrDefault(req.query.date, todayISO(), "date");
    try {
      return res.json(apiOk(req, await getMarketRadar(date)));
    } catch (error) {
      structuredLog({
        level: "error",
        event: "market_radar_request_failed",
        requestId: req.requestId,
        date,
        errorName: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : "Unknown Market Radar failure",
        providerStatus: error instanceof MarketRadarProviderError ? error.providerStatus : null,
      });
      if (error instanceof MarketRadarConfigurationError) {
        throw new AppError({
          status: 503,
          code: "external_service_error",
          message: "Market Radar is not configured.",
          expose: true,
          cause: error,
        });
      }
      if (error instanceof MarketRadarProviderError) {
        throw new AppError({
          status: 502,
          code: "upstream_unavailable",
          message: "Market Radar odds provider is unavailable.",
          expose: true,
          details: {
            provider: "odds_api",
            operation: error.operation,
            providerStatus: error.providerStatus,
          },
          cause: error,
        });
      }
      throw new AppError({
        status: 502,
        code: "upstream_unavailable",
        message: "Market Radar data sources are unavailable.",
        expose: true,
        cause: error,
      });
    }
  }),
);
