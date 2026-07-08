/** AI capper + judge agent routes. */
import type { Express, Request, Response } from "express";
import { listAgents, getAgent, generatePicks, JUDGE_AGENTS } from "../agents/agentRegistry";
import { getSharedDailyReport } from "../services/intelligence/mlbIntelligenceEngine";
import { generationLimiter } from "../middleware/rateLimit";
import { requireAuth, requireStaff } from "../middleware/auth";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../errors/AppError";
import { upstreamUnavailable } from "../lib/requestValidators";

export function registerAgentRoutes(app: Express): void {
  app.get("/api/agents", asyncHandler(async (_req: Request, res: Response) => {
    res.json({ ok: true, cappers: listAgents(), judges: JUDGE_AGENTS });
  }));

  app.get("/api/agents/:id", asyncHandler(async (req: Request, res: Response) => {
    const agent = getAgent(req.params.id);
    if (!agent) {
      throw new AppError({
        status: 404,
        code: "not_found",
        message: "Agent not found.",
      });
    }
    res.json({ ok: true, ...agent });
  }));

  /**
   * POST /api/agents/:id/generate-picks
   * Uses getSharedDailyReport() — if 5 cappers are called in parallel,
   * the MLB schedule + pitcher stats are fetched ONLY ONCE and the
   * in-flight Promise is shared across all callers.
   */
  app.post("/api/agents/:id/generate-picks", requireAuth, generationLimiter, asyncHandler(async (req: Request, res: Response) => {
    const start = Date.now();
    const agent = getAgent(req.params.id);
    if (!agent) {
      throw new AppError({
        status: 404,
        code: "not_found",
        message: "Agent not found.",
      });
    }

    try {
      const report = await getSharedDailyReport(req.body?.date);
      const picks = await generatePicks(agent.id, report);
      res.json({
        ok: true,
        agent: { id: agent.id, name: agent.name, icon: agent.icon },
        picks,
        warnings: report.warnings,
      });
    } catch (err: any) {
      console.error(`[agentRoutes] generate-picks failed for ${agent.id}:`, err.message);
      throw upstreamUnavailable("Failed to generate picks — MLB data unavailable.", err);
    } finally {
      console.log(`[endpoint] POST /api/agents/:id/generate-picks ${Date.now() - start}ms`);
    }
  }));

  /**
   * POST /api/agents/generate-all-picks
   * Builds the daily report ONCE, then runs all 5 cappers against it.
   * This is the most efficient endpoint — one MLB data fetch, 5 cappers.
   */
  app.post("/api/agents/generate-all-picks", requireAuth, requireStaff, generationLimiter, asyncHandler(async (req: Request, res: Response) => {
    const start = Date.now();
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
        ok: true,
        date: report.date,
        gameCount: report.gameCount,
        dataQuality: report.dataQuality,
        generatedAt: report.generatedAt,
        warnings: report.warnings,
        cappers: results,
      });
    } catch (err: any) {
      console.error("[agentRoutes] generate-all-picks failed:", err.message);
      throw upstreamUnavailable("Failed to generate picks — MLB data unavailable.", err);
    } finally {
      console.log(`[endpoint] POST /api/agents/generate-all-picks ${Date.now() - start}ms`);
    }
  }));
}
