/** Single entry point that registers every VouchEdge backend API route. */
import type { Express } from "express";
import { coreRoutes } from "./coreRoutes";
import { openapiRoutes } from "./openapiRoutes";
import { publicRoutes } from "./publicRoutes";
import { parlayRoutes } from "./parlayRoutes";
import { authRoutes } from "./authRoutes";
import { userRoutes } from "./userRoutes";
import { billingRoutes, stripeWebhookAliasRoutes } from "./billingRoutes";
import { discordRoutes } from "./discordRoutes";
import { adminRoutes } from "./adminRoutes";
import { privacyRoutes } from "./privacyRoutes";
import { postRoutes } from "./postRoutes";
import { vouchRoutes } from "./vouchRoutes";
import { hrNextRoutes } from "./hrNextRoutes";
import { hrListRoutes } from "./hrListRoutes";
import { getPublicHrList, hrListAuthorLabel } from "../services/hr-list/hrListService";
import { feedRoutes } from "./feedRoutes";
import { notificationRoutes } from "./notificationRoutes";
import { playerRegistryRoutes } from "./playerRegistryRoutes";
import { shareRoutes } from "./shareRoutes";
import { proofRoutes } from "./proofRoutes";
import { subscriberRoutes } from "./subscriberRoutes";
import { registerMlbRoutes } from "./mlbRoutes";
import { registerNflRoutes } from "./nflRoutes";
import { registerHrBoardRoutes } from "./mlbHrBoardRoutes";
import { registerMatchupRoutes } from "./mlbMatchupRoutes";
import { registerAgentRoutes } from "./agentRoutes";
import { registerJudgeRoutes } from "./judgeRoutes";
import { registerAiRoutes } from "./aiRoutes";
import { registerTrustRoutes } from "./trustRoutes";
import { registerResultRoutes } from "./resultRoutes";
import { registerAiJudgeSocialRoutes } from "./aiJudgeSocialRoutes";
import { registerCentralBrainRoutes } from "./centralBrainRoutes";
import { worldChatRoutes } from "./worldChatRoutes";
import { socialHubRoutes } from "./socialHubRoutes";
import { creatorBusinessRoutes } from "./creatorBusinessRoutes";
import { todayPreferencesRoutes } from "./todayPreferencesRoutes";
import { contactRoutes } from "./contactRoutes";
import { seoRoutes } from "./seoRoutes";
import { registerV3Routes } from "../v3/routes";
import { listSkills, runSkill } from "../skills/skillRegistry";
import { requireAuth, requireStaff } from "../middleware/auth";
import { authLimiter, generationLimiter } from "../middleware/rateLimit";
import { getPublicVouchWithAuthor } from "../services/persistence/vouchService";
import { getPublicParlayProof, formatProofTimestamp, parlayProofAuthorLabel } from "../services/proof/parlayProofService";
import { getBackendHealthReport } from "../services/health/backendHealthService";
import { getLegacyRouteMetricsSnapshot } from "../lib/observability/legacyRouteMetrics";
import { getRouteMetricsSnapshot } from "../lib/observability/routeMetrics";
import { getParlayGradeMetricsSnapshot } from "../lib/observability/parlayGradeMetrics";
import { getSupabaseAdmin } from "../middleware/auth";
import { isUpstashEnabled, redisPing } from "../lib/upstashRedis";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import { AppError } from "../errors/AppError";
import { captureException } from "../lib/sentry";
import type { Response } from "express";
import type { RequestWithContext } from "../middleware/requestContext";
import { getSafePublicOrigin } from "../lib/publicOrigin";

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
  app.use("/api/stripe", stripeWebhookAliasRoutes);
  app.use("/api/discord", discordRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/privacy", privacyRoutes);
  app.use("/api", openapiRoutes);
  app.use("/api", coreRoutes);
  app.use("/api", publicRoutes);
  app.use("/api/hr-next", hrNextRoutes);
  app.use("/api", hrListRoutes);
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
  app.use("/api", socialHubRoutes);
  app.use("/api", creatorBusinessRoutes);
  app.use("/api", todayPreferencesRoutes);
  app.use("/api", contactRoutes);
  app.use("/", seoRoutes);
  registerV3Routes(app);

  registerMlbRoutes(app);
  registerNflRoutes(app);
  registerHrBoardRoutes(app);
  registerMatchupRoutes(app);
  registerAgentRoutes(app);
  registerJudgeRoutes(app);
  registerAiRoutes(app);
  registerTrustRoutes(app);
  registerResultRoutes(app);
  registerAiJudgeSocialRoutes(app);
  registerCentralBrainRoutes(app);

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
  // instance instead of seeing a blind 200. Redis is required in production
  // boot, but readiness still only fails on database so a transient Redis
  // blip does not flap the load balancer.
  app.get("/api/health/ready", asyncHandler(async (req: RequestWithContext, res: Response) => {
    const checks: Record<string, { ok: boolean; detail?: string }> = {};

    try {
      const supabaseAdmin = await getSupabaseAdmin();
      const probe = (await Promise.race([
        supabaseAdmin.from("cappers").select("id", { head: true }).limit(1),
        new Promise((_, reject) => setTimeout(() => reject(new Error("db probe timed out after 3s")), 3000)),
      ])) as { error?: { message?: string } | null };
      checks.database = probe?.error
        ? { ok: false, detail: "database unreachable" }
        : { ok: true };
      if (probe?.error) {
        console.warn("[health/ready] database probe failed:", probe.error.message ?? "query error");
      }
    } catch (err) {
      console.warn("[health/ready] database probe error:", (err as Error)?.message ?? err);
      checks.database = { ok: false, detail: "database unreachable" };
    }

    if (isUpstashEnabled()) {
      const redisOk = await redisPing();
      checks.redis = redisOk
        ? { ok: true, detail: "upstash pong" }
        : { ok: false, detail: "upstash unreachable" };
    } else {
      // Not configured is fine for readiness — prod boot validates Redis separately.
      checks.redis = { ok: true, detail: "not configured (degraded to in-memory)" };
    }

    // Fail readiness only on database. Redis check is observational so a blip
    // does not flap the load balancer.
    const ready = checks.database.ok;
    res.status(ready ? 200 : 503).json({
      ok: ready,
      status: ready ? "ready" : "degraded",
      service: "vouchedge-backend",
      checks,
      time: new Date().toISOString(),
    });
  }));

  // Ops telemetry — staff-only. Keep /api/health (and /ready) public for load balancers.
  app.get("/api/health/backend", requireAuth, requireStaff, (req: RequestWithContext, res: Response) => {
    const report = getBackendHealthReport();
    res.json(apiOkFlat(req, report as unknown as Record<string, unknown>));
  });

  app.get("/api/health/metrics", requireAuth, requireStaff, (req: RequestWithContext, res: Response) => {
    const metrics = getRouteMetricsSnapshot();
    const parlayGrade = getParlayGradeMetricsSnapshot();
    const legacyRoutes = getLegacyRouteMetricsSnapshot();
    res.json(apiOkFlat(req, {
      service: "vouchedge-backend",
      schema: "route_metrics_v2",
      updatedAt: new Date().toISOString(),
      metrics,
      parlayGrade,
      legacyRoutes,
    }));
  });

  // Public share permalink — server-rendered (not the SPA) so X/Slack/iMessage
  // crawlers, which don't execute JS, see the Open Graph tags. Must be
  // registered before the SPA catch-all in server.ts; registerApiRoutes()
  // already runs before that catch-all.
  app.get("/v/:id", asyncHandler(async (req: RequestWithContext, res: Response) => {
    try {
      const result = await getPublicVouchWithAuthor(req.params.id);
      const baseUrl = getSafePublicOrigin();

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
      const baseUrl = getSafePublicOrigin();
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

  /**
   * Public "My HR List" permalink — server-rendered so X/Slack/iMessage
   * crawlers (which do not execute JS) see the Open Graph tags, and so the page
   * itself shows the player images and the VouchEdge mark rather than an empty
   * SPA shell. Registered before the SPA catch-all in server.ts.
   */
  app.get("/l/:id", asyncHandler(async (req: RequestWithContext, res: Response) => {
    try {
      const baseUrl = getSafePublicOrigin();
      const list = await getPublicHrList(req.params.id);

      if (!list) {
        res.status(404);
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("x-request-id", req.requestId ?? "unknown");
        return res.send(`<!doctype html><html><head><meta charset="utf-8"><title>HR list not found — VouchEdge</title></head><body><p>This HR list isn't available.</p></body></html>`);
      }

      const authorLabel = hrListAuthorLabel(list);
      const createdLabel = formatProofTimestamp(list.first_shared_at ?? list.created_at);
      const playerCount = list.entries.length;

      const title = escapeHtml(list.title);
      const topNames = list.entries.slice(0, 3).map((entry) => entry.playerName).join(", ");
      const description = escapeHtml(
        `${playerCount} HR ${playerCount === 1 ? "target" : "targets"}${list.slate_date ? ` · ${list.slate_date}` : ""}${topNames ? ` · ${topNames}` : ""} — by ${authorLabel} · ${createdLabel}`
      );
      const imageUrl = `${baseUrl}/api/share/hr-list/${encodeURIComponent(list.id)}/card.png`;
      const pageUrl = `${baseUrl}/l/${encodeURIComponent(list.id)}`;

      const rows = list.entries.map((entry, index) => {
        const headshot = `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${encodeURIComponent(String(entry.playerId))}/headshot/67/current`;
        const logo = entry.teamId != null && entry.teamId !== ""
          ? `https://www.mlbstatic.com/team-logos/${encodeURIComponent(String(entry.teamId))}.svg`
          : null;
        const rawProb = Number(entry.estimatedHrProb);
        const prob = Number.isFinite(rawProb) && rawProb > 0
          ? `${Math.round(rawProb > 1 ? rawProb : rawProb * 100)}%`
          : null;
        const matchup = [
          entry.team ? String(entry.team).toUpperCase() : null,
          entry.opponent ? `vs ${String(entry.opponent).toUpperCase()}` : null,
          entry.opposingPitcher ? String(entry.opposingPitcher) : null,
        ].filter(Boolean).join(" · ");

        return `<li class="row">
  <span class="rank">${index + 1}</span>
  <img class="face" src="${escapeHtml(headshot)}" alt="" width="48" height="48" loading="lazy">
  ${logo ? `<img class="logo" src="${escapeHtml(logo)}" alt="" width="26" height="26" loading="lazy">` : ""}
  <span class="who"><strong>${escapeHtml(entry.playerName)}</strong><em>${escapeHtml(matchup)}</em></span>
  ${entry.bestOdds ? `<span class="odds">${escapeHtml(entry.bestOdds)}</span>` : ""}
  ${prob ? `<span class="prob">${escapeHtml(prob)}<em>HR prob</em></span>` : ""}
  ${entry.grade ? `<span class="grade">${escapeHtml(entry.grade)}</span>` : ""}
</li>`;
      }).join("");

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=300");
      return res.send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — My HR List on VouchEdge</title>
<meta name="description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="VouchEdge">
<meta property="og:title" content="${title} — My HR List">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${imageUrl}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${description}">
<meta property="og:url" content="${pageUrl}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title} — My HR List">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${imageUrl}">
<link rel="canonical" href="${pageUrl}">
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;background:linear-gradient(160deg,#020617,#07131f);color:#f8fafc;padding:32px 20px 56px;display:flex;flex-direction:column;align-items:center;gap:20px}
.wrap{width:100%;max-width:720px;display:flex;flex-direction:column;gap:20px}
.brand{display:flex;align-items:center;gap:10px;font-weight:800;letter-spacing:2px;font-size:15px}
.brand svg{width:28px;height:28px}
.pill{font-size:10px;font-weight:800;letter-spacing:1.4px;color:#2EDB91;border:1px solid rgba(46,219,145,.45);background:rgba(46,219,145,.12);border-radius:8px;padding:4px 9px}
h1{margin:0;font-size:clamp(24px,5vw,34px);line-height:1.15}
.meta{margin:0;font-size:13px;color:#93a4bb;line-height:1.6}
.card{width:100%;border-radius:16px;border:1px solid #12314a;display:block}
ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.row{display:flex;align-items:center;gap:12px;background:#0b1220;border:1px solid #12314a;border-radius:14px;padding:10px 14px}
.rank{font-size:12px;font-weight:800;color:#5c6f88;width:16px;flex:none}
.face{border-radius:50%;background:#132033;flex:none;object-fit:cover}
.logo{border-radius:50%;background:#e8eef6;padding:3px;flex:none}
.who{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.who strong{font-size:16px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.who em{font-style:normal;font-size:12px;color:#93a4bb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.odds{font-size:15px;font-weight:700;color:#7DEBFF;flex:none}
.prob{display:flex;flex-direction:column;align-items:flex-end;font-size:15px;font-weight:800;flex:none}
.prob em{font-style:normal;font-size:9px;font-weight:700;letter-spacing:1px;color:#5c6f88}
.grade{font-size:14px;font-weight:800;color:#2EDB91;border:1px solid rgba(46,219,145,.4);background:rgba(46,219,145,.1);border-radius:8px;padding:5px 9px;flex:none;min-width:38px;text-align:center}
.cta{display:inline-block;background:#20C7F4;color:#03131b;font-weight:800;text-decoration:none;padding:13px 22px;border-radius:12px;text-align:center;font-size:15px}
.fine{font-size:11px;color:#5c6f88;line-height:1.6}
@media(max-width:520px){.odds{display:none}}
</style>
</head>
<body>
<div class="wrap">
  <div class="brand">
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M5 10.5 18.5 14 32 44.5 45.5 14 59 10.5 34.5 57h-5L5 10.5Z" fill="#20C7F4"/><path d="m18.5 31.5 10.25 12L46 22.5l5 4-22.25 27-15.5-18 5.25-4Z" fill="#2EDB91"/><path d="m46.5 10 8.5-3-3.5 7-8 3 3-7ZM51 19l7-2.5-2.75 5.75-6.75 2.5L51 19Z" fill="#7DEBFF"/></svg>
    VOUCHEDGE <span class="pill">MY HR LIST</span>
  </div>
  <h1>${title}</h1>
  <p class="meta">${description}</p>
  <img class="card" src="${imageUrl}" alt="${description}" width="1200" height="630">
  <ul>${rows}</ul>
  <a class="cta" href="${baseUrl}/">Build your own HR list on VouchEdge →</a>
  <p class="fine">Snapshot of what the HR board showed when each player was added — values are not rewritten after sharing. Probability-based research, not betting advice. 21+. Gambling problem? Call 1-800-GAMBLER.</p>
</div>
</body>
</html>`);
    } catch (error) {
      const requestId = req.requestId ?? "unknown";
      console.error("[share] /l/:id failed", JSON.stringify({
        requestId,
        listId: req.params.id,
        message: error instanceof Error ? error.message : String(error),
      }));
      captureException(error, { requestId, path: req.originalUrl, extra: { listId: req.params.id } });
      res.status(500);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("x-request-id", requestId);
      return res.send(`<!doctype html><html><head><meta charset="utf-8"><title>VouchEdge</title></head><body><p>Something went wrong loading this HR list.</p></body></html>`);
    }
  }));
}
