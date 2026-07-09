import type { NextFunction, Request, Response } from "express";
import { isUpstashEnabled, redisIncr } from "../lib/upstashRedis";
import { buildApiErrorResponse } from "../lib/apiResponse";
import type { RequestWithContext } from "./requestContext";

/**
 * Rate limiters.
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL/TOKEN are set (multi-instance safe).
 * Falls back to in-memory counters in local dev.
 */

const TRUST_PROXY = Number(process.env.TRUST_PROXY ?? 1);
void TRUST_PROXY;

type RateLimitOptions = {
  windowMs: number;
  limit: number;
  keyGenerator?: (req: Request) => string;
  handler: (req: Request, res: Response) => Response;
  skip?: (req: Request) => boolean;
  name: string;
};

type HitState = { count: number; resetAt: number };

const memoryHits = new Map<string, HitState>();

function keyGenerator(req: Request): string {
  const uid = (req as Request & { user?: { id?: string } }).user?.id;
  if (uid) return `u:${uid}`;

  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string") {
    const ip = xff.split(",")[0].trim();
    if (ip) return `ip:${ip}`;
  }

  return `ip:${req.ip ?? "unknown"}`;
}

function memoryHit(key: string, windowMs: number): number {
  const now = Date.now();
  const current = memoryHits.get(key);

  if (!current || current.resetAt <= now) {
    memoryHits.set(key, { count: 1, resetAt: now + windowMs });
    return 1;
  }

  current.count += 1;
  return current.count;
}

function handler(req: RequestWithContext, res: Response) {
  const requestId = req.requestId ?? "unknown";
  res.setHeader("x-request-id", requestId);
  return res.status(429).json(
    buildApiErrorResponse({
      code: "rate_limited",
      message: "Too many requests. Slow down or upgrade to a paid tier.",
      requestId,
      details: { retry_after_seconds: 60 },
    }),
  );
}

function rateLimit(options: RateLimitOptions) {
  const ttlSeconds = Math.max(1, Math.ceil(options.windowMs / 1000));

  return async (req: RequestWithContext, res: Response, next: NextFunction) => {
    if (options.skip?.(req)) return next();

    const keyBase = options.keyGenerator?.(req) ?? keyGenerator(req);
    const redisKey = `rl:${options.name}:${keyBase}`;

    if (isUpstashEnabled()) {
      try {
        const count = await redisIncr(redisKey, ttlSeconds);
        if (count !== null) {
          if (count > options.limit) return options.handler(req, res);
          return next();
        }
      } catch (error) {
        console.warn("[rateLimit] redis fallback", {
          limiter: options.name,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const count = memoryHit(redisKey, options.windowMs);
    if (count > options.limit) return options.handler(req, res);
    return next();
  };
}

export const globalLimiter = rateLimit({
  name: "global",
  windowMs: 60 * 1000,
  limit: 200,
  keyGenerator,
  handler,
  skip: (req) => req.path === "/api/health" || req.path === "/api/health/backend",
});

export const aiLimiter = rateLimit({
  name: "ai",
  windowMs: 60 * 1000,
  limit: 20,
  keyGenerator,
  handler,
});

export const authLimiter = rateLimit({
  name: "auth",
  windowMs: 60 * 1000,
  limit: 30,
  keyGenerator,
  handler,
});

export const generationLimiter = rateLimit({
  name: "generation",
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator,
  handler,
});

export const gradingLimiter = rateLimit({
  name: "grading",
  windowMs: 60 * 1000,
  limit: 30,
  keyGenerator,
  handler,
});

export const pickLimiter = rateLimit({
  name: "pick",
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator,
  handler,
});

export const worldChatLimiter = rateLimit({
  name: "world_chat",
  windowMs: 60 * 1000,
  limit: 30,
  keyGenerator,
  handler,
});

export const betaSignupLimiter = rateLimit({
  name: "beta_signup",
  windowMs: 60 * 60 * 1000,
  limit: 3,
  keyGenerator: (req: Request) =>
    `ip:${(req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.ip ?? "unknown"}`,
  handler,
});

export const webhookLimiter = rateLimit({
  name: "webhook",
  windowMs: 60 * 1000,
  limit: 100,
  keyGenerator: (req) => `webhook:${req.ip ?? "unknown"}`,
  handler,
});

/** Test helper — clears in-memory counters only. */
export function resetRateLimitMemoryForTests(): void {
  memoryHits.clear();
}
