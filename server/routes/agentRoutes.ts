/** AI capper + judge agent routes. */
import type { Express, Response } from "express";
import { listAgents, getAgent, generatePicks, JUDGE_AGENTS } from "../agents/agentRegistry";
import { getSharedDailyReport } from "../services/intelligence/mlbIntelligenceEngine";
import { generationLimiter } from "../middleware/rateLimit";
import { requireAuth, requireStaff, type AuthedRequest } from "../middleware/auth";
import { requireTierOrQuota, incrementQuota } from "../middleware/entitlements";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import { structuredLog } from "../lib/structuredLog";
import { AppError } from "../errors/AppError";
import { upstreamUnavailable } from "../lib/requestValidators";
import type { RequestWithContext } from "../middleware/requestContext";

function publicCapperView(agent: ReturnType<typeof getAgent>) {
  if (!agent) return null;
  const { promptTemplate: _promptTemplate, ...safe } = agent;
  void _promptTemplate;
  return safe;
}

export function registerAgentRoutes(app: Express): void {
  app.get("/api/agents", asyncHandler(async (req: RequestWithContext, res: Response) => {
    return res.json(apiOkFlat(req, {
      cappers: listAgents().map((agent) => publicCapperView(agent)),
      judges: JUDGE_AGENTS,
    }));
  }));

  app.get("/api/agents/:id", asyncHandler(async (req: RequestWithContext, res: Response) => {
    const agent = getAgent(req.params.id);
    if (!agent) {
      throw new AppError({
        status: 404,
        code: "not_found",
        message: "Agent not found.",
      });
    }
    return res.json(apiOkFlat(req, { ...publicCapperView(agent) }));
  }));

  /**
   * POST /api/agents/:id/generate-picks
   * Uses getSharedDailyReport() — if 5 cappers are called in parallel,
   * the MLB schedule + pitcher stats are fetched ONLY ONCE and the
   * in-flight Promise is shared across all callers.
   */
  app.post(
    "/api/agents/:id/generate-picks",
    requireAuth,
    generationLimiter,
    requireTierOrQuota("gold", 5, "agent_generate_picks"),
    asyncHandler(async (req: AuthedRequest & RequestWithContext, res: Response) => {
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
      const q = (req as { __quota?: { key: string; day: string } }).__quota;
      if (q) {
        await incrementQuota(req.user!.id, q.key, q.day);
      }
      return res.json(apiOkFlat(req, {
        agent: { id: agent.id, name: agent.name, icon: agent.icon },
        picks,
        warnings: report.warnings,
      }));
    } catch (err: any) {
      structuredLog({
        level: "error",
        event: "agent_generate_picks_failed",
        requestId: req.requestId,
        agentId: agent.id,
        message: err?.message,
      });
      throw upstreamUnavailable("Failed to generate picks — MLB data unavailable.", err);
    } finally {
      structuredLog({
        level: "info",
        event: "endpoint",
        requestId: req.requestId,
        method: "POST",
        route: "/api/agents/:id/generate-picks",
        durationMs: Date.now() - start,
        agentId: agent.id,
      });
    }
  }),
  );

  /**
   * POST /api/agents/generate-all-picks
   * Builds the daily report ONCE, then runs all 5 cappers against it.
   * This is the most efficient endpoint — one MLB data fetch, 5 cappers.
   */
  app.post("/api/agents/generate-all-picks", requireAuth, requireStaff, generationLimiter, asyncHandler(async (req: RequestWithContext, res: Response) => {
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

      return res.json(apiOkFlat(req, {
        date: report.date,
        gameCount: report.gameCount,
        dataQuality: report.dataQuality,
        generatedAt: report.generatedAt,
        warnings: report.warnings,
        cappers: results,
      }));
    } catch (err: any) {
      structuredLog({
        level: "error",
        event: "agent_generate_all_picks_failed",
        requestId: req.requestId,
        message: err?.message,
      });
      throw upstreamUnavailable("Failed to generate picks — MLB data unavailable.", err);
    } finally {
      structuredLog({
        level: "info",
        event: "endpoint",
        requestId: req.requestId,
        method: "POST",
        route: "/api/agents/generate-all-picks",
        durationMs: Date.now() - start,
      });
    }
  }));
}
