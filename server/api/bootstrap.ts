import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import { registerApiRoutes } from "../routes";
import { corsMiddleware, helmetMiddleware } from "../middleware/cors";
import { apiErrorHandler } from "../middleware/errorHandler";
import { apiNotFoundHandler } from "../middleware/apiNotFound";
import { aiLimiter, globalLimiter } from "../middleware/rateLimit";
import { requestContext } from "../middleware/requestContext";
import { routeTiming } from "../middleware/routeTiming";
import { initServerSentry, sentryErrorHandler, isSentryEnabled } from "../lib/sentry";
import { validateProductionEnvAtBoot } from "../lib/validateProductionEnv";

export async function createApiApp(httpServer?: http.Server) {
  validateProductionEnvAtBoot();
  const app = express();
  
  initServerSentry(app);

  app.set("trust proxy", Number(process.env.TRUST_PROXY ?? 1));
  app.use(requestContext);
  app.use(routeTiming);
  app.use(helmetMiddleware);

  // Raw body for Stripe webhook isolation
  app.use("/api/billing/webhook", express.raw({ type: "application/json", limit: "1mb" }));
  app.use(express.json({ limit: "256kb" }));

  // API middleware
  app.use("/api", corsMiddleware);
  app.use("/api", globalLimiter);
  app.use("/api/ai", aiLimiter);

  // Register domain API routes
  registerApiRoutes(app);
  app.use("/api", apiNotFoundHandler);
  
  if (isSentryEnabled()) {
    app.use("/api", sentryErrorHandler() as unknown as express.ErrorRequestHandler);
  }
  app.use("/api", apiErrorHandler);

  // Dev server static middleware
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
            res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
            return;
          }
          if (filePath.endsWith("service-worker.js") || filePath.endsWith("manifest.json")) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            return;
          }
          if (filePath.includes(`${path.sep}assets${path.sep}`) || filePath.includes(`${path.sep}icons${path.sep}`)) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          }
        },
      }),
    );

    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}
