import type { Response } from "express";
import { apiOkFlat } from "../../../lib/apiResponse";
import type { RequestWithContext } from "../../../middleware/requestContext";
import { getResolutionSlaSnapshot } from "../../../services/resolution/resolutionSlaService";

/**
 * Resolution Engine SLA telemetry. Staff-gated at the route level — this is
 * aggregate operational performance data, not a per-user surface.
 */
export async function sendV3ResolutionSlaResponse(req: RequestWithContext, res: Response) {
  const limit = (req.query.limit as unknown as number | undefined) ?? 12;

  return res.json(apiOkFlat(req, {
    version: "v3",
    sla: await getResolutionSlaSnapshot(limit),
  }));
}
