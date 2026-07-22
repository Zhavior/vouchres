import http from "http";
import dotenv from "dotenv";
import { createApiApp } from "./server/api/bootstrap";
import { startWorkerRuntime, type WorkerRuntimeHandle } from "./server/worker/bootstrap";
import { isSentryEnabled, captureException } from "./server/lib/sentry";
import { validateProductionEnvAtBoot } from "./server/lib/validateProductionEnv";
import { logDevSupabaseEnvStatus, syncDevSupabaseEnv } from "./server/lib/syncDevSupabaseEnv";
import { logWorldChatEphemeralBootNotice } from "./server/services/worldChat/worldChatStorage";

// Local/dev: load .env then .env.local (local wins).
if (process.env.VERCEL !== "1") {
  dotenv.config();
  dotenv.config({ path: ".env.local", override: true });
}
syncDevSupabaseEnv();
logDevSupabaseEnvStatus();
validateProductionEnvAtBoot();
logWorldChatEphemeralBootNotice();

export async function createApp(httpServer?: http.Server) {
  return createApiApp(httpServer);
}

let shuttingDown = false;
let workerRuntimeHandle: WorkerRuntimeHandle | null = null;

function registerProcessSafetyHandlers(httpServer: http.Server): void {
  process.on("unhandledRejection", (reason: unknown) => {
    console.error("[fatal] unhandledRejection:", reason);
    captureException(reason instanceof Error ? reason : new Error(String(reason)), {
      tags: { kind: "unhandledRejection" },
    });
  });

  process.on("uncaughtException", (err: Error) => {
    console.error("[fatal] uncaughtException:", err);
    captureException(err, { tags: { kind: "uncaughtException" } });
    gracefulShutdown(httpServer, "uncaughtException", 1);
  });

  process.on("SIGTERM", () => gracefulShutdown(httpServer, "SIGTERM", 0));
  process.on("SIGINT", () => gracefulShutdown(httpServer, "SIGINT", 0));
}

function gracefulShutdown(httpServer: http.Server, signal: string, code: number): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[shutdown] ${signal} received — draining in-flight requests…`);
  
  workerRuntimeHandle?.stop();
  workerRuntimeHandle = null;

  httpServer.close(() => {
    console.log("[shutdown] all connections drained, exiting.");
    process.exit(code);
  });

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
  
  // Launch modular worker runtime alongside API server
  workerRuntimeHandle = startWorkerRuntime();

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

if (process.env.VERCEL !== "1") {
  startServer();
}
