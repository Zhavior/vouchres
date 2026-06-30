/** Result ledger + grading routes. */
import type { Express, Request, Response } from "express";
import { getCapperPicks, getUserPicks } from "../services/trust/resultLedgerService";
import { gradeAndLearn } from "../services/results/learningNoteService";
import { requireAuth, requireStaff } from "../middleware/auth";
import type { AuthedRequest } from "../middleware/auth";
import { gradingLimiter } from "../middleware/rateLimit";

export function registerResultRoutes(app: Express): void {
  app.get("/api/results/ledger", requireAuth, (req: Request, res: Response) => {
    const authedReq = req as AuthedRequest;
    const capperId = req.query.capperId as string | undefined;
    if (capperId) {
      if (!authedReq.user?.profile.is_staff) {
        return res.status(403).json({ error: "staff_only" });
      }
      return res.json({ scope: "staff_capper", picks: getCapperPicks(capperId) });
    }
    res.json({ scope: "current_user", picks: getUserPicks(authedReq.user!.id) });
  });

  app.post("/api/results/grade", requireAuth, requireStaff, gradingLimiter, async (req: Request, res: Response) => {
    const { pickId, result, whatActuallyHappened } = req.body ?? {};
    if (!pickId || !result) return res.status(400).json({ error: "Missing pickId or result" });
    const out = await gradeAndLearn(pickId, result, whatActuallyHappened);
    if (!out.pick) return res.status(404).json({ error: "Pick not found" });
    res.json(out);
  });
}
