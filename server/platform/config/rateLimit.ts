import { isUpstashEnabled } from '../../lib/upstashRedis'

/** Requests that cannot change state or spend money on our side. */
const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * Read paths that still fail closed, because an unlimited read there is itself
 * expensive or security-sensitive: AI inference costs money per call, and auth
 * reads are a credential-probing surface.
 */
const FAIL_CLOSED_READ_PREFIXES = ['/api/ai', '/api/auth']

export interface RateLimitRequestShape {
  method?: string
  path?: string
}

export const RateLimitPolicy = {
  /**
   * Whether a Redis failure should reject the request (503) rather than fall
   * back to per-process limiting.
   *
   * Fail-closed exists so a Redis outage can't be used to bypass limits on
   * expensive or state-changing work. It is deliberately NOT applied to plain
   * reads: on 2026-08-05 a read-only Upstash token made every `INCR` throw, and
   * because this returned true for every request, 100% of the API — including
   * cached MLB reads and /api/health — served 503 for hours. Reads now degrade
   * to per-process counters instead, which bounds abuse without an outage.
   */
  failClosedOnRedisError(req?: RateLimitRequestShape): boolean {
    if (process.env.NODE_ENV !== 'production' || !isUpstashEnabled()) return false

    // No request context available — assume the strict path.
    if (!req) return true

    const method = String(req.method ?? 'GET').toUpperCase()
    if (!READ_METHODS.has(method)) return true

    const path = String(req.path ?? '')
    return FAIL_CLOSED_READ_PREFIXES.some((prefix) => path.startsWith(prefix))
  },
}
