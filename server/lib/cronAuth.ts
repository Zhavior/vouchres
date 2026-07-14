import { timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import { AppError } from "../errors/AppError";
import { isProductionRuntime } from "./runtime";

function readCronSecret(): string | null {
  const secret = process.env.CRON_SECRET?.trim();
  return secret ? secret : null;
}

/**
 * Constant-time string compare. Length mismatch returns false without throwing.
 */
function secretsEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) {
    // Still run a compare against `a` so timing does not short-circuit on length alone.
    timingSafeEqual(aBuf, aBuf);
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
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

  // Bearer only — never accept ?token= (leaks into access logs, Referer, and proxies).
  const authHeader = req.headers.authorization || "";
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!bearerToken) return false;
  return secretsEqual(bearerToken, cronSecret);
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
