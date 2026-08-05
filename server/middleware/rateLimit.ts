import type { NextFunction, Response } from 'express'
import type { RequestWithContext } from './requestContext'
import { getTitanDependencies } from '../platform/dependency'
import { RateLimitPolicy } from '../platform/config/rateLimit'
import { buildApiErrorResponse } from '../lib/apiResponse'
import { logger } from '../platform/logger'

export interface RateLimitOptions {
  windowMs: number
  max: number
  keyPrefix: string
}

/**
 * Liveness/readiness probes are never rate limited and never fail closed.
 *
 * A probe must report whether THIS PROCESS is healthy. If a degraded Redis can
 * turn /api/health into a 503, the probe stops describing the app and starts
 * describing Redis — which makes a rate-limiter blip indistinguishable from a
 * dead process, and (on hosts that restart on failed health checks) escalates a
 * degradation into a restart loop.
 */
const PROBE_PATHS = new Set(['/api/health', '/api/health/live', '/api/health/ready'])

/** Bound the in-memory bucket map so a spray of unique IPs can't grow it forever. */
const MAX_MEMORY_BUCKETS = 10_000

type MemoryBucket = { count: number; resetAt: number }

const memoryBuckets = new Map<string, MemoryBucket>()

/** Path without query string, tolerating bare request objects used in unit tests. */
function requestPath(req: Pick<RequestWithContext, 'originalUrl' | 'path'>): string {
  const raw = String(req.originalUrl ?? req.path ?? '')
  const queryAt = raw.indexOf('?')
  return queryAt === -1 ? raw : raw.slice(0, queryAt)
}

function isProbePath(req: Pick<RequestWithContext, 'originalUrl' | 'path'>): boolean {
  return PROBE_PATHS.has(requestPath(req))
}

/**
 * Rate-limit bucket key for the caller.
 *
 * Uses Express's resolved `req.ip`, which honours the app's `trust proxy` setting.
 * That matters: reading the leftmost X-Forwarded-For entry directly would let any
 * client mint a fresh bucket per request by spoofing the header.
 */
export function clientIpKey(req: Pick<RequestWithContext, 'ip' | 'socket'>): string {
  const raw = String(req.ip || req.socket?.remoteAddress || 'unknown').trim()
  // Normalise IPv4-mapped IPv6 so ::ffff:1.2.3.4 and 1.2.3.4 share one bucket.
  return raw.startsWith('::ffff:') ? raw.slice(7) : raw
}

function pruneMemoryBuckets(now: number): void {
  for (const [key, bucket] of memoryBuckets) {
    if (bucket.resetAt <= now) memoryBuckets.delete(key)
  }
  // Still oversized after dropping expired buckets — evict oldest-resetting first.
  while (memoryBuckets.size > MAX_MEMORY_BUCKETS) {
    const oldest = memoryBuckets.keys().next()
    if (oldest.done) break
    memoryBuckets.delete(oldest.value)
  }
}

function memoryIncr(key: string, ttlSeconds: number): MemoryBucket {
  const now = Date.now()
  const existing = memoryBuckets.get(key)

  if (!existing || existing.resetAt <= now) {
    const bucket: MemoryBucket = { count: 1, resetAt: now + ttlSeconds * 1000 }
    memoryBuckets.set(key, bucket)
    if (memoryBuckets.size > MAX_MEMORY_BUCKETS) pruneMemoryBuckets(now)
    return bucket
  }

  existing.count += 1
  return existing
}

/** Test hook — clears per-process counters between cases. */
export function resetRateLimitMemoryForTests(): void {
  memoryBuckets.clear()
}

function sendRateLimited(
  req: RequestWithContext,
  res: Response,
  options: RateLimitOptions,
  resetAt: number,
): Response {
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))

  res.setHeader('Retry-After', String(retryAfterSeconds))
  res.setHeader('X-RateLimit-Limit', String(options.max))
  res.setHeader('X-RateLimit-Remaining', '0')
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)))

  return res.status(429).json(
    buildApiErrorResponse({
      code: 'rate_limited',
      message: 'Too many requests. Please slow down.',
      requestId: req.requestId ?? 'unknown',
    }),
  )
}

export function rateLimit(options: RateLimitOptions) {
  const ttlSeconds = Math.max(1, Math.ceil(options.windowMs / 1000))
  const { redis } = getTitanDependencies()

  return async (req: RequestWithContext, res: Response, next: NextFunction) => {
    if (isProbePath(req)) return next()

    const ip = clientIpKey(req)
    const key = `${options.keyPrefix}:${ip}`

    // No shared store configured — limit per process rather than not at all.
    if (!redis.isEnabled()) {
      const bucket = memoryIncr(key, ttlSeconds)
      if (bucket.count > options.max) {
        return sendRateLimited(req, res, options, bucket.resetAt)
      }
      return next()
    }

    try {
      const count = await redis.incr(key, ttlSeconds)
      const hits = count ?? 0

      if (hits > options.max) {
        logger.info('ratelimit.block', {
          requestId: req.requestId,
          route: req.originalUrl,
          ip,
          key,
          hits,
        })

        return sendRateLimited(req, res, options, Date.now() + ttlSeconds * 1000)
      }

      return next()
    } catch (error) {
      logger.error('ratelimit.redis.error', {
        requestId: req.requestId,
        route: req.originalUrl,
        ip,
        key,
        error: error instanceof Error ? error.message : String(error),
      })

      if (RateLimitPolicy.failClosedOnRedisError({ method: req.method, path: requestPath(req) })) {
        return res.status(503).json(
          buildApiErrorResponse({
            code: 'upstream_unavailable',
            message: 'Rate limiting temporarily unavailable. Try again shortly.',
            requestId: req.requestId ?? 'unknown',
          }),
        )
      }

      // Reads degrade to per-process limiting instead of 503ing the whole API.
      // Weaker than the shared counter (the ceiling multiplies by instance count),
      // but it keeps cached reads serving through a Redis outage while still
      // bounding any single instance.
      const bucket = memoryIncr(key, ttlSeconds)
      if (bucket.count > options.max) {
        return sendRateLimited(req, res, options, bucket.resetAt)
      }
      return next()
    }
  }
}

export const aiLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  keyPrefix: 'rl:ai',
})

export const globalLimiter = rateLimit({
  windowMs: 60_000,
  max: 300,
  keyPrefix: 'rl:global',
})

export const generationLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  keyPrefix: 'rl:generation',
})

export const webhookLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  keyPrefix: 'rl:webhook',
})

export const betaSignupLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  keyPrefix: 'rl:beta-signup',
})

export const pickLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  keyPrefix: 'rl:pick',
})

export const authLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  keyPrefix: 'rl:auth',
})

export const gradingLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  keyPrefix: 'rl:grading',
})

export const mlbExpensiveReadLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  keyPrefix: 'rl:mlb-expensive-read',
})

export const mlbReadLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  keyPrefix: 'rl:mlb-read',
})

export const mlbMutationLimiter = rateLimit({
  windowMs: 60_000,
  max: 40,
  keyPrefix: 'rl:mlb-mutation',
})

export const worldChatLimiter = rateLimit({
  windowMs: 60_000,
  max: 40,
  keyPrefix: 'rl:world-chat',
})
