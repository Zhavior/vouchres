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
import { initServerSentry, sentryErrorHandler, isSentryEnabled } from "./server/lib/sentry";
import { validateProductionEnvAtBoot } from "./server/lib/validateProductionEnv";

// Load base env, then local secrets (.env.local) which take precedence.
// Keys (e.g. GEMINI_API_KEY) stay server-side only — never exposed to the client.
dotenv.config();
dotenv.config({ path: ".env.local", override: true });
validateProductionEnvAtBoot();

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
  app.use(express.json());

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

          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
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

async function startServer() {
  const httpServer = http.createServer();
  const app = await createApp(httpServer);
  httpServer.on("request", app);
  const PORT = Number(process.env.PORT) || 3000;

  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `[boot] Port ${PORT} is already in use. Stop the stale process: lsof -ti :${PORT} | xargs kill`,
      );
      process.exit(1);
    }
    throw err;
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server running on http://localhost:${PORT}`);
  });
}

if (process.env.VERCEL !== "1") {
  startServer();
}
