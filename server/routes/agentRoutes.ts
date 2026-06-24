/** AI capper + judge agent routes. */
import type { Express, Request, Response } from "express";
import { listAgents, getAgent, generatePicks, JUDGE_AGENTS } from "../agents/agentRegistry";
import { buildDailyReport } from "../services/intelligence/mlbIntelligenceEngine";

export function registerAgentRoutes(app: Express): void {
  app.get("/api/agents", (_req: Request, res: Response) => {
    res.json({ cappers: listAgents(), judges: JUDGE_AGENTS });
  });

  app.get("/api/agents/:id", (req: Request, res: Response) => {
    const agent = getAgent(req.params.id);
    if (!agent) return res.status(404).json({ error: "Agent not found" });
    res.json(agent);
  });

  app.post("/api/agents/:id/generate-picks", async (req: Request, res: Response) => {
    const agent = getAgent(req.params.id);
    if (!agent) return res.status(404).json({ error: "Agent not found" });
    const report = await buildDailyReport(req.body?.date);
    res.json({ agent: { id: agent.id, name: agent.name, icon: agent.icon }, picks: generatePicks(agent.id, report) });
  });
}
