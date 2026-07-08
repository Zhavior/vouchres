/** Single entry point that registers every VouchEdge backend API route. */
import type { Express } from "express";
import { coreRoutes } from "./coreRoutes";
import { openapiRoutes } from "./openapiRoutes";
import { publicRoutes } from "./publicRoutes";
import { parlayRoutes } from "./parlayRoutes";
import { authRoutes } from "./authRoutes";
import { billingRoutes } from "./billingRoutes";
import { adminRoutes } from "./adminRoutes";
import { privacyRoutes } from "./privacyRoutes";
import { postRoutes } from "./postRoutes";
import { vouchRoutes } from "./vouchRoutes";
import { feedRoutes } from "./feedRoutes";
import { notificationRoutes } from "./notificationRoutes";
import { playerRegistryRoutes } from "./playerRegistryRoutes";
import { shareRoutes } from "./shareRoutes";
import { registerMlbRoutes } from "./mlbRoutes";
import { registerHrBoardRoutes } from "./mlbHrBoardRoutes";
import { registerMatchupRoutes } from "./mlbMatchupRoutes";
import { registerAgentRoutes } from "./agentRoutes";
import { registerJudgeRoutes } from "./judgeRoutes";
import { registerAiRoutes } from "./aiRoutes";
import { registerTrustRoutes } from "./trustRoutes";
import { registerResultRoutes } from "./resultRoutes";
import { registerAiJudgeSocialRoutes } from "./aiJudgeSocialRoutes";
import { listSkills, runSkill } from "../skills/skillRegistry";
import { requireAuth, requireStaff } from "../middleware/auth";
import { authLimiter, generationLimiter } from "../middleware/rateLimit";
import { getPublicVouch } from "../services/persistence/vouchService";
import { getBackendHealthReport } from "../services/health/backendHealthService";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../errors/AppError";
import { captureException } from "../lib/sentry";
import type { Request, Response } from "express";
import type { RequestWithContext } from "../middleware/requestContext";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function registerApiRoutes(app: Express): void {
  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api/billing", billingRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/privacy", privacyRoutes);
  app.use("/api", openapiRoutes);
  app.use("/api", coreRoutes);
  app.use("/api", publicRoutes);
  app.use("/api", parlayRoutes);
  app.use("/api", postRoutes);
  app.use("/api", vouchRoutes);
  app.use("/api", feedRoutes);
  app.use("/api", notificationRoutes);
  app.use("/api", playerRegistryRoutes);
  app.use("/api", shareRoutes);

  registerMlbRoutes(app);
  registerHrBoardRoutes(app);
  registerMatchupRoutes(app);
  registerAgentRoutes(app);
  registerJudgeRoutes(app);
  registerAiRoutes(app);
  registerTrustRoutes(app);
  registerResultRoutes(app);
  registerAiJudgeSocialRoutes(app);

  // Skills introspection + generic runner.
  app.get("/api/skills", (_req: Request, res: Response) => res.json({ ok: true, skills: listSkills() }));
  app.post("/api/skills/:id/run", requireAuth, requireStaff, generationLimiter, asyncHandler(async (req: Request, res: Response) => {
    try {
      res.json({ ok: true, result: await runSkill(req.params.id, req.body ?? {}) });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Skill failed.";
      if (message.startsWith("Unknown skill:")) {
        throw new AppError({
          status: 404,
          code: "not_found",
          message,
          details: { skillId: req.params.id },
        });
      }
      throw new AppError({
        status: 400,
        code: "bad_request",
        message,
        details: { skillId: req.params.id },
        cause: err,
      });
    }
  }));

  // Backend health.
  app.get("/api/system/core-health", (_req: Request, res: Response) =>
    res.json({
      ok: true,
      status: "ok",
      service: "vouchedge-core",
      routes: {
        core: true,
        parlays: true,
        playerRegistry: true,
      },
      time: new Date().toISOString(),
    })
  );

  app.get("/api/health", (_req: Request, res: Response) =>
    res.json({ ok: true, status: "ok", service: "vouchedge-backend", time: new Date().toISOString() })
  );

  app.get("/api/health/backend", (_req: Request, res: Response) => {
    const report = getBackendHealthReport();
    res.json(report);
  });

  // Public share permalink — server-rendered (not the SPA) so X/Slack/iMessage
  // crawlers, which don't execute JS, see the Open Graph tags. Must be
  // registered before the SPA catch-all in server.ts; registerApiRoutes()
  // already runs before that catch-all.
  app.get("/v/:id", asyncHandler(async (req: RequestWithContext, res: Response) => {
    try {
      const vouch = await getPublicVouch(req.params.id);
      const baseUrl = `${req.protocol}://${req.get("host")}`;

      if (!vouch) {
        res.status(404);
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("x-request-id", req.requestId ?? "unknown");
        return res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Vouch not found — VouchEdge</title></head><body><p>This vouch isn't available.</p></body></html>`);
      }

      const title = escapeHtml(`${vouch.player_or_team || vouch.market} — ${vouch.market}`);
      const description = escapeHtml(
        `${vouch.odds} odds${vouch.ai_confidence != null ? ` · ${Math.round(vouch.ai_confidence)}% AI confidence` : ""} — ${vouch.game_name}`
      );
      const imageUrl = `${baseUrl}/api/share/vouch/${encodeURIComponent(vouch.id)}/card.png`;
      const pageUrl = `${baseUrl}/v/${encodeURIComponent(vouch.id)}`;

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=300");
      return res.send(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${title} — VouchEdge</title>
<meta name="description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${imageUrl}">
<meta property="og:url" content="${pageUrl}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${imageUrl}">
<style>body{font-family:Inter,Arial,sans-serif;background:#020617;color:#f8fafc;display:flex;flex-direction:column;align-items:center;padding:40px 20px;gap:16px}img{max-width:600px;width:100%;border-radius:16px}a{color:#22d3ee;font-weight:700;text-decoration:none}</style>
</head>
<body>
<img src="${imageUrl}" alt="${title}">
<p>${description}</p>
<a href="${baseUrl}/">Open in VouchEdge →</a>
<p style="font-size:12px;color:#9aa8bd">Probability-based. No guarantees. Research and entertainment only.</p>
</body>
</html>`);
    } catch (error) {
      const requestId = req.requestId ?? "unknown";
      console.error("[share] /v/:id failed", JSON.stringify({
        requestId,
        vouchId: req.params.id,
        message: error instanceof Error ? error.message : String(error),
      }));
      captureException(error, { requestId, path: req.originalUrl, vouchId: req.params.id });
      res.status(500);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("x-request-id", requestId);
      return res.send(`<!doctype html><html><head><meta charset="utf-8"><title>VouchEdge</title></head><body><p>Something went wrong loading this vouch.</p></body></html>`);
    }
  }));
}
