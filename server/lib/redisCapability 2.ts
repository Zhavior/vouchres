import { isUpstashEnabled, redisIncr } from './upstashRedis'
import { logger } from '../platform/logger'

/**
 * Verifies that the configured Redis credential can actually WRITE.
 *
 * `getMissingProductionConfig()` only checks that UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are non-empty. A read-only Upstash token satisfies
 * that check and boots cleanly, then fails every `INCR` at request time with
 * `NOPERM`. That exact configuration ran in production for 24 days on
 * 2026-08-05 before anyone noticed. Presence is not capability — probe it.
 */

export interface RedisCapabilityResult {
  configured: boolean
  canWrite: boolean
  error: string | null
  checkedAt: string
}

const PROBE_KEY = 'diag:write-capability-probe'
const PROBE_TTL_SECONDS = 120

let lastResult: RedisCapabilityResult | null = null

export async function probeRedisWriteCapability(): Promise<RedisCapabilityResult> {
  const checkedAt = new Date().toISOString()

  if (!isUpstashEnabled()) {
    lastResult = { configured: false, canWrite: false, error: null, checkedAt }
    return lastResult
  }

  try {
    // INCR is the exact command the rate limiter depends on, so probe with it
    // rather than a PING — a read-only token answers PING happily.
    await redisIncr(PROBE_KEY, PROBE_TTL_SECONDS)
    lastResult = { configured: true, canWrite: true, error: null, checkedAt }
  } catch (error) {
    lastResult = {
      configured: true,
      canWrite: false,
      error: error instanceof Error ? error.message : String(error),
      checkedAt,
    }
  }

  return lastResult
}

/** Last probe result, or null if the probe has not run in this process yet. */
export function getRedisCapability(): RedisCapabilityResult | null {
  return lastResult
}

/**
 * Fire the probe at boot without blocking it.
 *
 * Deliberately non-fatal. Hard-failing boot on a Redis error would turn a
 * transient upstream blip into a crash loop — the opposite of the availability
 * we're protecting. Instead this logs at error level, which reaches Sentry and
 * pages, and surfaces in the health report. Use `npm run verify:redis-write`
 * for a hard, exit-code gate in CI or after a deploy.
 */
export function probeRedisWriteCapabilityInBackground(): void {
  void probeRedisWriteCapability().then((result) => {
    if (result.configured && !result.canWrite) {
      logger.error('redis.write_capability.failed', {
        error: result.error,
        hint:
          'Redis is configured but cannot execute INCR. A read-only token will ' +
          'break rate limiting and every cache write. Replace ' +
          'UPSTASH_REDIS_REST_TOKEN with a write-capable token and redeploy.',
      })
    }
  })
}
