/** AI explanation / daily report / learning note routes (Gemini backend-only). */
import type { Express, Request, Response } from "express";
import { explainPick } from "../services/ai/pickExplanationService";
import { getDailyReportNarrative } from "../services/ai/dailyReportService";
import { generateLearningNote } from "../services/ai/learningNoteService";
import { PickCandidate } from "../services/judging/judgeTypes";
import { requireAuth } from "../middleware/auth";
import { generationLimiter } from "../middleware/rateLimit";

export function registerAiRoutes(app: Express): void {
  app.post("/api/ai/explain-pick", requireAuth, generationLimiter, async (req: Request, res: Response) => {
    const pick = req.body?.pick as PickCandidate;
    if (!pick) return res.status(400).json({ error: "Missing pick" });
    res.json(await explainPick(pick));
  });

  app.post("/api/ai/daily-report", requireAuth, generationLimiter, async (req: Request, res: Response) => {
    res.json(await getDailyReportNarrative(req.body?.date));
  });

  app.post("/api/ai/learning-note", requireAuth, generationLimiter, async (req: Request, res: Response) => {
    const { pickId, result, originalLogic, whatActuallyHappened } = req.body ?? {};
    if (!pickId || !result) return res.status(400).json({ error: "Missing pickId or result" });
    res.json(await generateLearningNote({ pickId, result, originalLogic: originalLogic ?? "", whatActuallyHappened }));
  });
}
