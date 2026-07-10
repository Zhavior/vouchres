/** Trust score + verified record routes. */
import type { Express, Response } from "express";
import { AppError } from "../errors/AppError";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import type { RequestWithContext } from "../middleware/requestContext";
import { getUserTrust, getCapperTrust } from "../services/trust/trustScoreService";
import { getVerifiedRecord } from "../services/trust/verifiedRecordService";

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
    const userId = requirePathId(req.params.userId, "userId");
    return res.json(apiOkFlat(req, { trust: await getUserTrust(userId) }));
  }));

  app.get("/api/trust/capper/:capperId", asyncHandler(async (req: RequestWithContext, res: Response) => {
    const capperId = requirePathId(req.params.capperId, "capperId");
    const [trust, verifiedRecord] = await Promise.all([
      getCapperTrust(capperId),
      getVerifiedRecord(capperId),
    ]);
    return res.json(apiOkFlat(req, { trust, verifiedRecord }));
  }));
}
