/** Trust score + verified record routes. */
import type { Express, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { asyncHandler } from "../lib/asyncHandler";
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
  app.get("/api/trust/user/:userId", asyncHandler(async (req: Request, res: Response) => {
    const userId = requirePathId(req.params.userId, "userId");
    return res.json({ ok: true, trust: getUserTrust(userId) });
  }));

  app.get("/api/trust/capper/:capperId", asyncHandler(async (req: Request, res: Response) => {
    const capperId = requirePathId(req.params.capperId, "capperId");
    return res.json({
      ok: true,
      trust: getCapperTrust(capperId),
      verifiedRecord: getVerifiedRecord(capperId),
    });
  }));
}
