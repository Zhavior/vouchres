import type { Response } from "express";
import { Router } from "express";
import { asyncHandler } from "../../../lib/asyncHandler";
import type { RequestWithContext } from "../../../middleware/requestContext";
import { sendV3CapperTrustResponse, sendV3UserTrustResponse } from "./handlers";

export const v3TrustRoutes = Router();

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
