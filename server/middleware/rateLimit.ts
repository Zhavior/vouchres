import type { NextFunction, Request, Response } from "express";

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
void TRUST_PROXY;

type RateLimitOptions = {
  windowMs: number;
  limit: number;
  keyGenerator?: (req: Request) => string;
  handler: (req: Request, res: Response) => Response;
  skip?: (req: Request) => boolean;
};

function rateLimit(options: RateLimitOptions) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    if (options.skip?.(req)) return next();

    const now = Date.now();
    const key = options.keyGenerator?.(req) ?? keyGenerator(req);
    const current = hits.get(key);

    if (!current || current.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    current.count += 1;
    if (current.count > options.limit) return options.handler(req, res);
    return next();
  };
}

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
  keyGenerator,
  handler,
});

/**
 * Auth limiter — applied to auth-adjacent endpoints.
 * Backend login/signup are handled by Supabase client-side today, but this
 * still protects username checks and any future server auth endpoints.
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  keyGenerator,
  handler,
});

/**
 * Generation limiter — expensive AI/agent/image/social-draft generation.
 */
export const generationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator,
  handler,
});

/**
 * Grading limiter — live grading and judge endpoints.
 */
export const gradingLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
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
