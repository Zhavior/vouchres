import express from "express";
import cookieParser from "cookie-parser";
import { registerV3Routes } from "./routes";
import appConfig from "../platform/config/appConfig";
import { corsMiddleware, helmetMiddleware } from "../middleware/cors";
import { apiErrorHandler } from "../middleware/errorHandler";
import { apiNotFoundHandler } from "../middleware/apiNotFound";
import { globalLimiter } from "../middleware/rateLimit";
import { requestContext } from "../middleware/requestContext";
import { routeTiming } from "../middleware/routeTiming";
import { initServerSentry, isSentryEnabled, sentryErrorHandler } from "../lib/sentry";

export function createV3App() {
  const app = express();

  initServerSentry(app);
  app.set("trust proxy", appConfig.trustProxy);
  app.use(requestContext);
  app.use(routeTiming);
  app.use(helmetMiddleware);
  app.use(cookieParser());
  app.use("/api/v3/billing/webhook", express.raw({ type: "application/json", limit: "1mb" }));
  app.use(express.json({ limit: "256kb" }));
  app.use("/api", corsMiddleware);
  app.use("/api", globalLimiter);

  registerV3Routes(app);
  app.use("/api", apiNotFoundHandler);
  if (isSentryEnabled()) {
    app.use("/api", sentryErrorHandler() as unknown as express.ErrorRequestHandler);
  }
  app.use("/api", apiErrorHandler);

  return app;
}
