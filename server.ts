import http from "http";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { registerApiRoutes } from "./server/routes";
import { corsMiddleware, helmetMiddleware } from "./server/middleware/cors";
import { apiErrorHandler } from "./server/middleware/errorHandler";
import { apiNotFoundHandler } from "./server/middleware/apiNotFound";
import { aiLimiter, globalLimiter } from "./server/middleware/rateLimit";
import { requestContext } from "./server/middleware/requestContext";
import { routeTiming } from "./server/middleware/routeTiming";
import { initServerSentry, sentryErrorHandler, isSentryEnabled, captureException } from "./server/lib/sentry";
import { validateProductionEnvAtBoot } from "./server/lib/validateProductionEnv";
import { logDevSupabaseEnvStatus, syncDevSupabaseEnv } from "./server/lib/syncDevSupabaseEnv";
import { logWorldChatEphemeralBootNotice } from "./server/services/worldChat/worldChatStorage";

// Local/dev: load .env then .env.local (local wins).
// On Vercel, platform Environment Variables are the source of truth — do not
// dotenv-override them (an uploaded/empty .env.local can wipe SENTRY_DSN etc.).
if (process.env.VERCEL !== "1") {
  dotenv.config();
  dotenv.config({ path: ".env.local", override: true });
}
syncDevSupabaseEnv();
logDevSupabaseEnvStatus();
validateProductionEnvAtBoot();
logWorldChatEphemeralBootNotice();

export async function createApp(httpServer?: http.Server) {
  validateProductionEnvAtBoot();
  const app = express();
  
  initServerSentry(app);

  app.set("trust proxy", Number(process.env.TRUST_PROXY ?? 1));
  app.use(requestContext);
  app.use(routeTiming);
  app.use(helmetMiddleware);

  // Stripe signature verification requires the raw body. This must run before
  // express.json(); the billing router handles the actual webhook route.
  app.use("/api/billing/webhook", express.raw({ type: "application/json", limit: "1mb" }));
  app.use(express.json({ limit: "256kb" }));

  // CORS applies to API only — static JS/CSS assets must not be blocked by API origin rules.
  app.use("/api", corsMiddleware);
  app.use("/api", globalLimiter);
  app.use("/api/ai", aiLimiter);

  // VouchEdge intelligence backbone: MLB, agents, judges, AI, trust, results, skills.
  // Registered before the Vite/static catch-all so these API paths resolve first.
  registerApiRoutes(app);
  app.use("/api", apiNotFoundHandler);
  if (isSentryEnabled()) {
    app.use("/api", sentryErrorHandler() as unknown as express.ErrorRequestHandler);
  }
  app.use("/api", apiErrorHandler);

  // Serve static assets with Vite dev server middleware compatibility
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ...(httpServer ? { hmr: { server: httpServer } } : {}),
      },
      appType: "spa",
      define: {
        "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(process.env.VITE_SUPABASE_URL ?? ""),
        "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY ?? ""),
      },
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith("index.html")) {
            res.setHeader(
              "Cache-Control",
              "no-store, no-cache, must-revalidate, proxy-revalidate",
            );
            return;
          }

          if (filePath.endsWith("service-worker.js") || filePath.endsWith("manifest.json")) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            if (filePath.endsWith("service-worker.js")) {
              res.setHeader("Service-Worker-Allowed", "/");
            }
            return;
          }

          if (
            filePath.includes(`${path.sep}assets${path.sep}`) ||
            filePath.includes(`${path.sep}icons${path.sep}`)
          ) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          }
        },
      }),
    );

    app.get("*", (req, res) => {
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      );
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

return app;
}

/**
 * Process-level safety net. Without these, an unhandled promise rejection or
 * an error thrown in a background task (grading cron, MLB fetch) takes the
 * whole Node process down with no trace beyond an unexplained restart —
 * running the money path blind. These log to stdout (Render captures it) AND
 * to Sentry when configured, so a crash is never silent.
 */
function registerProcessSafetyHandlers(httpServer: http.Server): void {
  process.on("unhandledRejection", (reason: unknown) => {
    console.error("[fatal] unhandledRejection:", reason);
    captureException(reason instanceof Error ? reason : new Error(String(reason)), {
      tags: { kind: "unhandledRejection" },
    });
    // Do not exit — a stray rejection shouldn't take down a healthy server;
    // it's logged + reported so it can be fixed.
  });

  process.on("uncaughtException", (err: Error) => {
    console.error("[fatal] uncaughtException:", err);
    captureException(err, { tags: { kind: "uncaughtException" } });
    // An uncaught exception leaves the process in an undefined state — drain
    // and exit so the platform restarts a clean instance.
    gracefulShutdown(httpServer, "uncaughtException", 1);
  });

  process.on("SIGTERM", () => gracefulShutdown(httpServer, "SIGTERM", 0));
  process.on("SIGINT", () => gracefulShutdown(httpServer, "SIGINT", 0));
}

let shuttingDown = false;

/**
 * Drain in-flight requests before exiting. Render sends SIGTERM on every
 * deploy and scale event; without this the process is hard-killed mid-request,
 * which can orphan a money-path write (e.g. a Stripe webhook between its
 * "processing" and "finished" states).
 */
function gracefulShutdown(httpServer: http.Server, signal: string, code: number): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[shutdown] ${signal} received — draining in-flight requests…`);

  httpServer.close(() => {
    console.log("[shutdown] all connections drained, exiting.");
    process.exit(code);
  });

  // Hard cap so a stuck connection can't block the deploy forever.
  setTimeout(() => {
    console.error("[shutdown] drain timed out after 10s, forcing exit.");
    process.exit(code);
  }, 10_000).unref();
}

async function startServer() {
  const httpServer = http.createServer();
  const app = await createApp(httpServer);
  httpServer.on("request", app);
  const PORT = Number(process.env.PORT) || 3000;

  registerProcessSafetyHandlers(httpServer);

  // Loud, unmissable warning if production is running without error tracking —
  // the two highest-stakes signals (failed payment, crashed grading) funnel to
  // Sentry, so a missing DSN means running blind. Not a hard boot-fail so a
  // deploy isn't blocked, but it should never go unnoticed.
  if (process.env.NODE_ENV === "production" && !isSentryEnabled()) {
    console.warn(
      "[boot] ⚠️  SENTRY_DSN is not set — server errors, failed Stripe webhooks, " +
        "and grading crashes will NOT be reported anywhere except stdout. " +
        "Set SENTRY_DSN before taking real payments.",
    );
  }

  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`[boot] Port ${PORT} is already in use.`);
      console.error(`[boot] Run: npm run dev:port   (see what is listening)`);
      console.error(`[boot] Run: npm run dev:stop   (force kill stale process)`);
      console.error(`[boot] Or use another port: PORT=3001 npm run dev`);
      process.exit(1);
    }
    throw err;
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server running on http://localhost:${PORT}`);
  });
}

// Render / local dev listen on a port. Vercel serverless (api/index.ts) imports
// dist/server.cjs and calls createApp() only — it must not bind a port here.
if (process.env.VERCEL !== "1") {
  startServer();
}
