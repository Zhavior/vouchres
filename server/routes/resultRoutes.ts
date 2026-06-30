/** Result ledger + grading routes. */
import type { Express, Request, Response } from "express";
import { getLedger } from "../services/persistence/pickService";
import { gradeAndLearn } from "../services/results/learningNoteService";
import { requireAuth, requireStaff } from "../middleware/auth";
import type { AuthedRequest } from "../middleware/auth";
import { gradingLimiter } from "../middleware/rateLimit";

export function registerResultRoutes(app: Express): void {
  app.get("/api/results/ledger", requireAuth, async (req: Request, res: Response) => {
    const authedReq = req as AuthedRequest;
    const capperId = req.query.capperId as string | undefined;
    const limit = Math.min(Number(req.query.limit ?? 100), 200);
    const offset = Number(req.query.offset ?? 0);
    try {
      if (capperId) {
        if (!authedReq.user?.profile.is_staff) {
          return res.status(403).json({ error: "staff_only" });
        }
        const out = await getLedger({ capperId, limit, offset });
        return res.json({ scope: "staff_capper", picks: out.picks, total: out.total, warnings: [] });
      }
      const out = await getLedger({ userId: authedReq.user!.id, limit, offset });
      return res.json({ scope: "current_user", picks: out.picks, total: out.total, warnings: [] });
    } catch (err: any) {
      console.error("[results] ledger failed", err?.message);
      return res.status(500).json({ error: "ledger_fetch_failed", message: err?.message, warnings: [err?.message ?? "ledger_fetch_failed"] });
    }
  });

  app.post("/api/results/grade", requireAuth, requireStaff, gradingLimiter, async (req: Request, res: Response) => {
    const { pickId, result, whatActuallyHappened } = req.body ?? {};
    if (!pickId || !result) return res.status(400).json({ error: "Missing pickId or result" });
    const out = await gradeAndLearn(pickId, result, whatActuallyHappened);
    if (!out.pick) return res.status(404).json({ error: "Pick not found" });
    res.json(out);
  });
}
