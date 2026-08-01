import type { NextFunction, Response } from 'express'
import type { RequestWithContext } from './requestContext'
import { getTitanDependencies } from '../platform/dependency'
import { RateLimitPolicy } from '../platform/config/rateLimit'
import { logger } from '../platform/logger'

export interface RateLimitOptions {
  windowMs: number
  max: number
  keyPrefix: string
}

export function rateLimit(options: RateLimitOptions) {
  const ttlSeconds = Math.max(1, Math.ceil(options.windowMs / 1000))
  const { redis } = getTitanDependencies()

  return async (req: RequestWithContext, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown'
    const key = `${options.keyPrefix}:${ip}`

    if (!redis.isEnabled()) {
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

        return res.status(429).json({
          code: 'ratelimit_exceeded',
          message: 'Too many requests.',
          requestId: req.requestId,
        })
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

      if (RateLimitPolicy.failClosedOnRedisError()) {
        return res.status(503).json({
          code: 'ratelimit_unavailable',
          message: 'Rate limiting is temporarily unavailable.',
          requestId: req.requestId,
        })
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
