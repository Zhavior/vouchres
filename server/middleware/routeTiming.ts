import type { NextFunction, Response } from "express";
import type { RequestWithContext } from "./requestContext";
import { recordRouteMetric } from "../lib/observability/routeMetrics";
import { structuredLog } from "../lib/structuredLog";

function routeLabel(req: RequestWithContext): string {
  const routePath = req.route?.path;
  if (typeof routePath === "string") return routePath;
  if (Array.isArray(routePath)) return routePath.join("|");

  const baseUrl = req.baseUrl || "";
  const path = req.path || req.originalUrl.split("?")[0] || "unknown";
  return `${baseUrl}${path}`;
}

export function routeTiming(req: RequestWithContext, res: Response, next: NextFunction) {
  const started = process.hrtime.bigint();

  res.on("finish", () => {
    if (!req.originalUrl.startsWith("/api")) return;

    const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
    const route = routeLabel(req);

    recordRouteMetric({
      method: req.method,
      route,
      status: res.statusCode,
      durationMs,
      requestId: req.requestId,
    });

    structuredLog({
      level: res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
      event: "request",
      requestId: req.requestId,
      method: req.method,
      route,
      status: res.statusCode,
      durationMs: Math.round(durationMs),
    });
  });

  next();
}
