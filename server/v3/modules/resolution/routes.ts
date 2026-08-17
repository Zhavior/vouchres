import type { Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../../lib/asyncHandler";
import { requireAuth, requireStaff } from "../../../middleware/auth";
import { validate } from "../../../middleware/validation";
import type { RequestWithContext } from "../../../middleware/requestContext";
import { sendV3ResolutionSlaResponse } from "./handlers";

export const v3ResolutionRoutes = Router();

const slaQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(60).optional(),
});

/**
 * GET /api/v3/resolution/sla — Resolution Engine SLA metrics by window.
 *
 * Staff-gated (requireAuth + requireStaff), same as the other aggregate
 * telemetry surfaces (/api/health/metrics, /api/v3/system/self-heal).
 */
v3ResolutionRoutes.get(
  "/sla",
  requireAuth,
  requireStaff,
  validate({ query: slaQuerySchema }),
  asyncHandler(async (req: RequestWithContext, res: Response) =>
    sendV3ResolutionSlaResponse(req, res)),
);
