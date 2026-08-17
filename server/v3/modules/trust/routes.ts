import type { Response } from "express";
import { Router } from "express";
import { asyncHandler } from "../../../lib/asyncHandler";
import { requireAuth, requireStaff } from "../../../middleware/auth";
import type { RequestWithContext } from "../../../middleware/requestContext";
import {
  sendV3CapperTrustResponse,
  sendV3TrustCalibrationResponse,
  sendV3UserTrustResponse,
} from "./handlers";

export const v3TrustRoutes = Router();

/**
 * GET /api/v3/trust/calibration — system-wide trust calibration metrics.
 *
 * Staff-gated (requireAuth + requireStaff), matching the other aggregate
 * telemetry surfaces (/api/health/metrics, /api/v3/system/self-heal): this
 * exposes model-quality internals across the whole user base rather than a
 * single subject's public trust record.
 */
v3TrustRoutes.get(
  "/calibration",
  requireAuth,
  requireStaff,
  asyncHandler(async (req: RequestWithContext, res: Response) =>
    sendV3TrustCalibrationResponse(req, res)),
);

v3TrustRoutes.get(
  "/user/:userId",
  asyncHandler(async (req: RequestWithContext, res: Response) =>
    sendV3UserTrustResponse(req, res, { includeVersion: true })),
);

v3TrustRoutes.get(
  "/capper/:capperId",
  asyncHandler(async (req: RequestWithContext, res: Response) =>
    sendV3CapperTrustResponse(req, res, { includeVersion: true })),
);
