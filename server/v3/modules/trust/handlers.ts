import type { Response } from "express";
import { AppError } from "../../../errors/AppError";
import { apiOkFlat } from "../../../lib/apiResponse";
import type { RequestWithContext } from "../../../middleware/requestContext";
import { getVerifiedRecord } from "../../../services/trust/verifiedRecordService";
import { getCapperTrust, getUserTrust } from "../../../services/trust/trustScoreService";

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

export async function sendV3UserTrustResponse(
  req: RequestWithContext,
  res: Response,
  options: { includeVersion?: boolean } = {},
) {
  const userId = requirePathId(req.params.userId, "userId");
  return res.json(apiOkFlat(req, {
    ...(options.includeVersion ? { version: "v3" } : {}),
    trust: await getUserTrust(userId),
  }));
}

export async function sendV3CapperTrustResponse(
  req: RequestWithContext,
  res: Response,
  options: { includeVersion?: boolean } = {},
) {
  const capperId = requirePathId(req.params.capperId, "capperId");
  const [trust, verifiedRecord] = await Promise.all([
    getCapperTrust(capperId),
    getVerifiedRecord(capperId),
  ]);

  return res.json(apiOkFlat(req, {
    ...(options.includeVersion ? { version: "v3" } : {}),
    trust,
    verifiedRecord,
  }));
}
