/** Single entry point that registers every VouchEdge backend API route. */
import type { Express } from "express";
import { coreRoutes } from "./coreRoutes";
import { openapiRoutes } from "./openapiRoutes";
import { publicRoutes } from "./publicRoutes";
import { parlayRoutes } from "./parlayRoutes";
import { authRoutes } from "./authRoutes";
import { userRoutes } from "./userRoutes";
import { billingRoutes } from "./billingRoutes";
import { adminRoutes } from "./adminRoutes";
import { privacyRoutes } from "./privacyRoutes";
import { postRoutes } from "./postRoutes";
import { vouchRoutes } from "./vouchRoutes";
import { feedRoutes } from "./feedRoutes";
import { notificationRoutes } from "./notificationRoutes";
import { playerRegistryRoutes } from "./playerRegistryRoutes";
import { shareRoutes } from "./shareRoutes";
import { proofRoutes } from "./proofRoutes";
import { subscriberRoutes } from "./subscriberRoutes";
import { registerMlbRoutes } from "./mlbRoutes";
import { registerHrBoardRoutes } from "./mlbHrBoardRoutes";
import { registerMatchupRoutes } from "./mlbMatchupRoutes";
import { registerAgentRoutes } from "./agentRoutes";
import { registerJudgeRoutes } from "./judgeRoutes";
import { registerAiRoutes } from "./aiRoutes";
import { registerTrustRoutes } from "./trustRoutes";
import { registerResultRoutes } from "./resultRoutes";
import { registerAiJudgeSocialRoutes } from "./aiJudgeSocialRoutes";
import { worldChatRoutes } from "./worldChatRoutes";
import { listSkills, runSkill } from "../skills/skillRegistry";
import { requireAuth, requireStaff } from "../middleware/auth";
import { authLimiter, generationLimiter } from "../middleware/rateLimit";
import { getPublicVouchWithAuthor } from "../services/persistence/vouchService";
import { getPublicParlayProof, formatProofTimestamp, parlayProofAuthorLabel } from "../services/proof/parlayProofService";
import { getBackendHealthReport } from "../services/health/backendHealthService";
import { getRouteMetricsSnapshot } from "../lib/observability/routeMetrics";
import { getSupabaseAdmin } from "../middleware/auth";
import { isUpstashEnabled } from "../lib/upstashRedis";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import { AppError } from "../errors/AppError";
import { captureException } from "../lib/sentry";
import type { Response } from "express";
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
  app.use("/api/users", userRoutes);
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
  app.use("/api", proofRoutes);
  app.use("/api", subscriberRoutes);
  app.use("/api", worldChatRoutes);

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
  app.get("/api/skills", (req: RequestWithContext, res: Response) =>
    res.json(apiOkFlat(req, { skills: listSkills() })));
  app.post("/api/skills/:id/run", requireAuth, requireStaff, generationLimiter, asyncHandler(async (req: RequestWithContext, res: Response) => {
    try {
      res.json(apiOkFlat(req, { result: await runSkill(req.params.id, req.body ?? {}) }));
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
  app.get("/api/system/core-health", (req: RequestWithContext, res: Response) =>
    res.json(apiOkFlat(req, {
      status: "ok",
      service: "vouchedge-core",
      routes: {
        core: true,
        parlays: true,
        playerRegistry: true,
      },
      time: new Date().toISOString(),
    }))
  );

  // Liveness — is the process up and serving? Deliberately dependency-free so
  // a transient DB blip doesn't flap Render's deploy health check into a
  // restart loop. Point Render's healthCheckPath here.
  app.get("/api/health", (req: RequestWithContext, res: Response) =>
    res.json(apiOkFlat(req, {
      status: "ok",
      service: "vouchedge-backend",
      time: new Date().toISOString(),
    }))
  );

  // Readiness — can this instance actually serve requests (dependencies
  // reachable)? Returns 503 when the database is unreachable so an uptime
  // monitor / load balancer readiness probe stops routing to a broken
  // instance instead of seeing a blind 200. Redis is optional (the app
  // degrades to in-memory), so it's reported but never fails readiness.
  app.get("/api/health/ready", asyncHandler(async (req: RequestWithContext, res: Response) => {
    const checks: Record<string, { ok: boolean; detail?: string }> = {};

    try {
      const supabaseAdmin = await getSupabaseAdmin();
      const probe = (await Promise.race([
        supabaseAdmin.from("cappers").select("id", { head: true }).limit(1),
        new Promise((_, reject) => setTimeout(() => reject(new Error("db probe timed out after 3s")), 3000)),
      ])) as { error?: { message?: string } | null };
      checks.database = probe?.error
        ? { ok: false, detail: probe.error.message ?? "query error" }
        : { ok: true };
    } catch (err) {
      checks.database = { ok: false, detail: (err as Error)?.message ?? "unreachable" };
    }

    checks.redis = isUpstashEnabled()
      ? { ok: true, detail: "upstash" }
      : { ok: true, detail: "not configured (degraded to in-memory)" };

    const ready = checks.database.ok;
    res.status(ready ? 200 : 503).json({
      ok: ready,
      status: ready ? "ready" : "degraded",
      service: "vouchedge-backend",
      checks,
      time: new Date().toISOString(),
    });
  }));

  app.get("/api/health/backend", (req: RequestWithContext, res: Response) => {
    const report = getBackendHealthReport();
    res.json(apiOkFlat(req, report as unknown as Record<string, unknown>));
  });

  app.get("/api/health/metrics", (req: RequestWithContext, res: Response) => {
    const metrics = getRouteMetricsSnapshot();
    res.json(apiOkFlat(req, {
      service: "vouchedge-backend",
      schema: "route_metrics_v1",
      updatedAt: new Date().toISOString(),
      metrics,
    }));
  });

  // Public share permalink — server-rendered (not the SPA) so X/Slack/iMessage
  // crawlers, which don't execute JS, see the Open Graph tags. Must be
  // registered before the SPA catch-all in server.ts; registerApiRoutes()
  // already runs before that catch-all.
  app.get("/v/:id", asyncHandler(async (req: RequestWithContext, res: Response) => {
    try {
      const result = await getPublicVouchWithAuthor(req.params.id);
      const baseUrl = `${req.protocol}://${req.get("host")}`;

      if (!result) {
        res.status(404);
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("x-request-id", req.requestId ?? "unknown");
        return res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Vouch not found — VouchEdge</title></head><body><p>This vouch isn't available.</p></body></html>`);
      }

      const { vouch, author } = result;
      const authorLabel = author?.handle
        ? `@${author.handle}`
        : author?.username
          ? `@${author.username}`
          : "VouchEdge user";
      const createdLabel = formatProofTimestamp(vouch.created_at);

      const title = escapeHtml(`${vouch.player_or_team || vouch.market} — ${vouch.market}`);
      const description = escapeHtml(
        `${vouch.odds} odds${vouch.ai_confidence != null ? ` · ${Math.round(vouch.ai_confidence)}% AI confidence` : ""} — ${vouch.game_name} · by ${authorLabel} · ${createdLabel}`
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
<style>body{font-family:Inter,Arial,sans-serif;background:#020617;color:#f8fafc;display:flex;flex-direction:column;align-items:center;padding:40px 20px;gap:16px}img{max-width:600px;width:100%;border-radius:16px}a{color:#22d3ee;font-weight:700;text-decoration:none}.meta{font-size:13px;color:#9aa8bd;text-align:center;max-width:640px;line-height:1.5}</style>
</head>
<body>
<img src="${imageUrl}" alt="${title}">
<p>${description}</p>
<p class="meta">Authored by <strong>${escapeHtml(authorLabel)}</strong> · Recorded ${escapeHtml(createdLabel)}</p>
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

  app.get("/p/:id", asyncHandler(async (req: RequestWithContext, res: Response) => {
    try {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const proof = await getPublicParlayProof(req.params.id, baseUrl);

      if (!proof) {
        res.status(404);
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("x-request-id", req.requestId ?? "unknown");
        return res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Parlay not found — VouchEdge</title></head><body><p>This parlay proof isn't available.</p></body></html>`);
      }

      const authorLabel = escapeHtml(parlayProofAuthorLabel(proof));
      const createdLabel = escapeHtml(formatProofTimestamp(proof.created_at));
      const lockedLabel = proof.locked_at ? escapeHtml(formatProofTimestamp(proof.locked_at)) : null;
      const proofHashLabel = proof.proof_hash ? escapeHtml(proof.proof_hash) : null;
      const otsDownloadUrl = proof.has_ots_proof
        ? `${baseUrl}/api/proof/parlay/${encodeURIComponent(proof.id)}/ots`
        : null;
      const otsStampLabel = proof.ots_stamped_at ? escapeHtml(formatProofTimestamp(proof.ots_stamped_at)) : null;
      const trustTimeline = (proof.trust_events ?? [])
        .map((event) => `<li><strong>${escapeHtml(event.label)}</strong> · ${escapeHtml(formatProofTimestamp(event.created_at))}</li>`)
        .join("");
      const titleText = escapeHtml(proof.explanation || proof.selection || `${proof.legs.length}-leg parlay`);
      const title = `${titleText} — VouchEdge Parlay Proof`;
      const description = escapeHtml(
        `${proof.legs.length} legs · ${proof.odds_decimal != null ? `${Number(proof.odds_decimal).toFixed(2)}x` : "combined odds pending"} · ${proof.status.toUpperCase()} · by ${authorLabel.replace(/&amp;/g, "&")} · ${createdLabel.replace(/&amp;/g, "&")}`
      );
      const imageUrl = `${baseUrl}/api/share/parlay/${encodeURIComponent(proof.id)}/card.png`;
      const pageUrl = `${baseUrl}/p/${encodeURIComponent(proof.id)}`;

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=300");
      return res.send(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
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
<style>body{font-family:Inter,Arial,sans-serif;background:#020617;color:#f8fafc;display:flex;flex-direction:column;align-items:center;padding:40px 20px;gap:16px}img{max-width:600px;width:100%;border-radius:16px}a{color:#22d3ee;font-weight:700;text-decoration:none}.meta{font-size:13px;color:#9aa8bd;text-align:center;max-width:640px;line-height:1.5}.hash{font-family:ui-monospace,Menlo,monospace;font-size:11px;word-break:break-all;color:#67e8f9;background:#0b1220;border:1px solid #164e63;border-radius:10px;padding:10px 12px;max-width:640px;width:100%}ul{max-width:640px;width:100%;list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}li{background:#0b1220;border:1px solid #164e63;border-radius:12px;padding:12px 14px;font-size:14px}.timeline li{background:#071018;border-color:#1e293b;font-size:12px}</style>
</head>
<body>
<img src="${imageUrl}" alt="${titleText}">
<p>${description}</p>
<p class="meta">Authored by <strong>${authorLabel}</strong> · Recorded ${createdLabel}${lockedLabel ? ` · <strong>Locked at share</strong> ${lockedLabel}` : ""}</p>
${proofHashLabel ? `<p class="hash"><strong>Proof hash (SHA-256):</strong><br>${proofHashLabel}</p>` : ""}
${otsDownloadUrl ? `<p class="meta"><a href="${otsDownloadUrl}">Download OpenTimestamp proof (.ots)</a>${otsStampLabel ? ` · stamped ${otsStampLabel}` : ""}</p>` : ""}
<ul>${proof.legs.map((leg, index) => `<li><strong>Leg ${index + 1}:</strong> ${escapeHtml(String(leg.selection || leg.market || "Prop"))}</li>`).join("")}</ul>
${trustTimeline ? `<ul class="timeline">${trustTimeline}</ul>` : ""}
<a href="${baseUrl}/">Open in VouchEdge →</a>
<p style="font-size:12px;color:#9aa8bd">Probability-based. No guarantees. Research and entertainment only.</p>
</body>
</html>`);
    } catch (error) {
      const requestId = req.requestId ?? "unknown";
      console.error("[share] /p/:id failed", JSON.stringify({
        requestId,
        parlayId: req.params.id,
        message: error instanceof Error ? error.message : String(error),
      }));
      captureException(error, { requestId, path: req.originalUrl, extra: { parlayId: req.params.id } });
      res.status(500);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("x-request-id", requestId);
      return res.send(`<!doctype html><html><head><meta charset="utf-8"><title>VouchEdge</title></head><body><p>Something went wrong loading this parlay proof.</p></body></html>`);
    }
  }));
}
