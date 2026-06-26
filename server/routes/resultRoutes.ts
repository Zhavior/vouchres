/** Result ledger + grading routes. */
import type { Express, Request, Response } from "express";
import { getAllPicks, getCapperPicks } from "../services/trust/resultLedgerService";
import { gradeAndLearn } from "../services/results/learningNoteService";

export function registerResultRoutes(app: Express): void {
  app.get("/api/results/ledger", (req: Request, res: Response) => {
    const capperId = req.query.capperId as string | undefined;
    res.json({ picks: capperId ? getCapperPicks(capperId) : getAllPicks() });
  });

  app.post("/api/results/grade", async (req: Request, res: Response) => {
    const { pickId, result, whatActuallyHappened } = req.body ?? {};
    if (!pickId || !result) return res.status(400).json({ error: "Missing pickId or result" });
    const out = await gradeAndLearn(pickId, result, whatActuallyHappened);
    if (!out.pick) return res.status(404).json({ error: "Pick not found" });
    res.json(out);
  });
}
