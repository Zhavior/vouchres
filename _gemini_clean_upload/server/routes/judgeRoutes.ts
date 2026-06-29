/** AI judge routes — review picks / parlays / bias. */
import type { Express, Request, Response } from "express";
import { runJudgePanel } from "../services/judging/trustJudgeService";
import { judgeBias } from "../services/judging/biasJudgeService";
import { PickCandidate } from "../services/judging/judgeTypes";

export function registerJudgeRoutes(app: Express): void {
  app.post("/api/judge/pick", (req: Request, res: Response) => {
    const pick = req.body?.pick as PickCandidate;
    if (!pick) return res.status(400).json({ error: "Missing pick" });
    res.json({ verdict: runJudgePanel(pick) });
  });

  app.post("/api/judge/parlay", (req: Request, res: Response) => {
    const pick = (req.body?.pick ?? {}) as PickCandidate;
    res.json({ verdict: runJudgePanel({ ...pick, isParlay: true, legs: pick.legs ?? req.body?.legs ?? 3 }) });
  });

  app.post("/api/judge/bias", (req: Request, res: Response) => {
    const pick = req.body?.pick as PickCandidate;
    if (!pick) return res.status(400).json({ error: "Missing pick" });
    res.json({ result: judgeBias(pick) });
  });
}
