/** Trust score + verified record routes. */
import type { Express, Response } from "express";
import { AppError } from "../errors/AppError";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import type { RequestWithContext } from "../middleware/requestContext";
import { getUserTrust, getCapperTrust } from "../services/trust/trustScoreService";
import { getVerifiedRecord } from "../services/trust/verifiedRecordService";
import { sendV3CapperTrustResponse, sendV3UserTrustResponse } from "../v3/modules/trust/handlers";

function requirePathId(value: unknown, field: string): string {
  const id = typeof value === "string" ? value.trim() : "";
  if (!id) {
    throw new AppError({
      status: 400,
      code: "validation_error",
      message: `${field} is required.`,
      details: [{ path: field, message: "Required." }],
    });
  }
  return id;
}

export function registerTrustRoutes(app: Express): void {
  app.get("/api/trust/user/:userId", asyncHandler(async (req: RequestWithContext, res: Response) => {
    return sendV3UserTrustResponse(req, res);
  }));

  app.get("/api/trust/capper/:capperId", asyncHandler(async (req: RequestWithContext, res: Response) => {
    return sendV3CapperTrustResponse(req, res);
  }));
}
