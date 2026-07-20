import http from "http";
import dotenv from "dotenv";
import { createV3App } from "./app";
import { captureException, isSentryEnabled } from "../lib/sentry";
import { logDevSupabaseEnvStatus, syncDevSupabaseEnv } from "../lib/syncDevSupabaseEnv";
import { validateProductionEnvAtBoot } from "../lib/validateProductionEnv";

if (process.env.VERCEL !== "1") {
  dotenv.config();
  dotenv.config({ path: ".env.local", override: true });
}

syncDevSupabaseEnv();
logDevSupabaseEnvStatus();
validateProductionEnvAtBoot();

let shuttingDown = false;

function gracefulShutdown(httpServer: http.Server, signal: string, code: number): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[v3/shutdown] ${signal} received — draining in-flight requests...`);

  httpServer.close(() => {
    console.log("[v3/shutdown] all connections drained, exiting.");
    process.exit(code);
  });

  setTimeout(() => {
    console.error("[v3/shutdown] drain timed out after 10s, forcing exit.");
    process.exit(code);
  }, 10_000).unref();
}

function registerProcessSafetyHandlers(httpServer: http.Server): void {
  process.on("unhandledRejection", (reason: unknown) => {
    console.error("[v3/fatal] unhandledRejection:", reason);
    captureException(reason instanceof Error ? reason : new Error(String(reason)), {
      tags: { kind: "unhandledRejection", runtime: "v3" },
    });
  });

  process.on("uncaughtException", (err: Error) => {
    console.error("[v3/fatal] uncaughtException:", err);
    captureException(err, { tags: { kind: "uncaughtException", runtime: "v3" } });
    gracefulShutdown(httpServer, "uncaughtException", 1);
  });

  process.on("SIGTERM", () => gracefulShutdown(httpServer, "SIGTERM", 0));
  process.on("SIGINT", () => gracefulShutdown(httpServer, "SIGINT", 0));
}

export async function startV3Server() {
  const httpServer = http.createServer();
  const app = createV3App();
  const port = Number(process.env.V3_PORT ?? process.env.PORT ?? 3100);

  httpServer.on("request", app);
  registerProcessSafetyHandlers(httpServer);

  if (process.env.NODE_ENV === "production" && !isSentryEnabled()) {
    console.warn(
      "[v3/boot] SENTRY_DSN is not set — the replacement backend will run without error reporting.",
    );
  }

  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`[v3/boot] Port ${port} is already in use.`);
      process.exit(1);
    }
    throw err;
  });

  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`Vouchres backend v3 running on http://localhost:${port}`);
  });
}

if (process.env.VERCEL !== "1") {
  startV3Server();
}
