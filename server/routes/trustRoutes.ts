/** Trust score + verified record routes. */
import type { Express, Request, Response } from "express";
import { getUserTrust, getCapperTrust } from "../services/trust/trustScoreService";
import { getVerifiedRecord } from "../services/trust/verifiedRecordService";

export function registerTrustRoutes(app: Express): void {
  app.get("/api/trust/user/:userId", (req: Request, res: Response) => {
    res.json(getUserTrust(req.params.userId));
  });

  app.get("/api/trust/capper/:capperId", (req: Request, res: Response) => {
    res.json({ trust: getCapperTrust(req.params.capperId), verifiedRecord: getVerifiedRecord(req.params.capperId) });
  });
}
