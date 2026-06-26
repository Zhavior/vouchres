/** AI capper + judge agent routes. */
import type { Express, Request, Response } from "express";
import { listAgents, getAgent, generatePicks, JUDGE_AGENTS } from "../agents/agentRegistry";
import { getSharedDailyReport } from "../services/intelligence/mlbIntelligenceEngine";

export function registerAgentRoutes(app: Express): void {
  app.get("/api/agents", (_req: Request, res: Response) => {
    res.json({ cappers: listAgents(), judges: JUDGE_AGENTS });
  });

  app.get("/api/agents/:id", (req: Request, res: Response) => {
    const agent = getAgent(req.params.id);
    if (!agent) return res.status(404).json({ error: "Agent not found" });
    res.json(agent);
  });

  /**
   * POST /api/agents/:id/generate-picks
   * Uses getSharedDailyReport() — if 5 cappers are called in parallel,
   * the MLB schedule + pitcher stats are fetched ONLY ONCE and the
   * in-flight Promise is shared across all callers.
   */
  app.post("/api/agents/:id/generate-picks", async (req: Request, res: Response) => {
    const agent = getAgent(req.params.id);
    if (!agent) return res.status(404).json({ error: "Agent not found" });
    try {
      const report = await getSharedDailyReport(req.body?.date);
      const picks = await generatePicks(agent.id, report);
      res.json({ agent: { id: agent.id, name: agent.name, icon: agent.icon }, picks });
    } catch (err: any) {
      console.error(`[agentRoutes] generate-picks failed for ${agent.id}:`, err.message);
      res.status(503).json({
        error: "Failed to generate picks — MLB data unavailable",
        message: err?.message,
      });
    }
  });

  /**
   * POST /api/agents/generate-all-picks
   * Builds the daily report ONCE, then runs all 5 cappers against it.
   * This is the most efficient endpoint — one MLB data fetch, 5 cappers.
   */
  app.post("/api/agents/generate-all-picks", async (req: Request, res: Response) => {
    try {
      const report = await getSharedDailyReport(req.body?.date);
      const cappers = listAgents();

      const results = await Promise.all(
        cappers.map(async (capper) => {
          try {
            const picks = await generatePicks(capper.id, report);
            return {
              agent: { id: capper.id, name: capper.name, icon: capper.icon },
              picks,
            };
          } catch (err: any) {
            return {
              agent: { id: capper.id, name: capper.name, icon: capper.icon },
              picks: [],
              error: err?.message,
            };
          }
        })
      );

      res.json({
        date: report.date,
        gameCount: report.gameCount,
        dataQuality: report.dataQuality,
        generatedAt: report.generatedAt,
        cappers: results,
      });
    } catch (err: any) {
      console.error("[agentRoutes] generate-all-picks failed:", err.message);
      res.status(503).json({
        error: "Failed to generate picks — MLB data unavailable",
        message: err?.message,
      });
    }
  });
}
