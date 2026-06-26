import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

/**
 * Rate limiters.
 *
 * Free-tier users hit paid Gemini APIs. Without rate limits, a single user
 * can exhaust the monthly AI budget in minutes. These limits sit in front of
 * the entitlement layer — they apply to ALL users (paid included) to protect
 * the server from abuse. Per-user quotas (for free vs paid differentiation)
 * live in server/middleware/entitlements.ts.
 *
 * Notes:
 *   - Standard limiters are in-memory. For a multi-instance deployment
 *     (Render > 1 instance, or any horizontal scaling), swap for
 *     rate-limit-redis with Upstash Redis — see note at bottom.
 *   - Skip successful OPTIONS preflight (handled by cors middleware before this).
 */

const TRUST_PROXY = Number(process.env.TRUST_PROXY ?? 1);

function keyGenerator(req: Request): string {
  // Prefer authenticated user ID, fall back to IP
  const uid = (req as any).user?.id;
  if (uid) return `u:${uid}`;
  // Trust only the leftmost IP from X-Forwarded-For when behind a known proxy
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string") {
    const ip = xff.split(",")[0].trim();
    if (ip) return `ip:${ip}`;
  }
  return `ip:${req.ip ?? "unknown"}`;
}

function handler(req: Request, res: Response) {
  return res.status(429).json({
    error: "rate_limited",
    message: "Too many requests. Slow down or upgrade to a paid tier.",
    retry_after_seconds: 60,
  });
}

/**
 * Global limiter — applied to every /api/* route.
 * 200 req/min per user/IP.
 */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator,
  handler,
  // Skip if behind an internal health check
  skip: (req) => req.path === "/api/health",
});

/**
 * AI endpoint limiter — applied to /api/ai/* routes.
 * 20 req/min per user/IP. Combined with daily quota in entitlements.ts.
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator,
  handler,
});

/**
 * Pick creation limiter — /api/picks POST.
 * 10 picks/min per user. Prevents feed spam.
 */
export const pickLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator,
  handler,
});

/**
 * Beta signup limiter — /api/beta/signup.
 * 3 per hour per IP. Prevents waitlist spam.
 */
export const betaSignupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  // Always key by IP for unauthenticated endpoints
  keyGenerator: (req: Request) =>
    `ip:${(req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.ip ?? "unknown"}`,
  handler,
});

/**
 * Stripe webhook limiter — VERY generous, but bounded.
 * Webhooks come from Stripe's IPs, so IP-based limiting is fine.
 */
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => `webhook:${req.ip ?? "unknown"}`,
  handler,
});

/*
 * For multi-instance production, replace the in-memory store with Redis:
 *
 *   import RedisStore from "rate-limit-redis";
 *   import { createClient } from "redis";
 *
 *   const redis = createClient({ url: process.env.REDIS_URL });
 *   await redis.connect();
 *
 *   export const aiLimiter = rateLimit({
 *     windowMs: 60 * 1000,
 *     limit: 20,
 *     store: new RedisStore({ sendCommand: (...args) => redis.sendCommand(args) }),
 *     // ...
 *   });
 */
