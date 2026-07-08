import type { Request } from "express";
import { AppError } from "../errors/AppError";
import { isProductionRuntime } from "./runtime";

function readCronSecret(): string | null {
  const secret = process.env.CRON_SECRET?.trim();
  return secret ? secret : null;
}

/**
 * Cron endpoints are open in dev when CRON_SECRET is unset.
 * In production, missing CRON_SECRET fails closed (deny all cron traffic).
 */
export function isAuthorizedCronRequest(req: Request): boolean {
  const cronSecret = readCronSecret();
  if (!cronSecret) {
    return !isProductionRuntime();
  }

  const authHeader = req.headers.authorization || "";
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";
  const queryToken = typeof req.query.token === "string" ? req.query.token : "";

  return bearerToken === cronSecret || queryToken === cronSecret;
}

export function assertCronAuthorized(req: Request): void {
  if (!isAuthorizedCronRequest(req)) {
    const cronSecret = readCronSecret();
    if (!cronSecret && isProductionRuntime()) {
      throw new AppError({
        status: 503,
        code: "internal_server_error",
        message: "Cron authentication is not configured.",
        expose: false,
      });
    }

    throw new AppError({
      status: 401,
      code: "invalid_token",
      message: "Unauthorized cron request.",
    });
  }
}
