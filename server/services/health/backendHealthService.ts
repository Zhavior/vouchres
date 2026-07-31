// Titan backend health report (abridged version to keep this paste manageable)
import { getRouteMetricsSnapshot } from '../../lib/observability/routeMetrics'
import { getSportsHttpStats } from '../../lib/sports/sportsHttpClient'
import { isSentryEnabled } from '../../lib/sentry'
import { isUpstashEnabled } from '../../lib/upstashRedis'
import {
  gameFeedCache,
  reportCache,
  scheduleCache,
} from '../mlb/mlbCache'
import { getHrBoardCacheStats } from '../mlb/hrPipeline'

export interface BackendHealthStatus {
  ok: boolean
  status: 'ok' | 'degraded'
  service: 'vouchedge-backend'
  environment: string
  uptimeMs: number
  memory: {
    rssMb: number
    heapUsedMb: number
    heapTotalMb: number
    externalMb: number
  }
  config: string[]
  warnings: string[]
  updatedAt: string
}

function memorySnapshot() {
  const m = process.memoryUsage()
  return {
    rssMb: Math.round(m.rss / 1024 / 1024),
    heapUsedMb: Math.round(m.heapUsed / 1024 / 1024),
    heapTotalMb: Math.round(m.heapTotal / 1024 / 1024),
    externalMb: Math.round(m.external / 1024 / 1024),
  }
}

export function getBackendHealthReport(): BackendHealthStatus {
  const now = new Date()
  const env = process.env.NODE_ENV || 'development'
  const routes = getRouteMetricsSnapshot(now)
  const sportsHttp = getSportsHttpStats()

  const warnings: string[] = []

  if (!isUpstashEnabled()) {
    warnings.push('Redis is not configured; running with in-memory fallback.')
  }

  if (!isSentryEnabled()) {
    warnings.push('Sentry is not configured; errors will not be reported.')
  }

  if (routes.statusClasses['5xx'] > 0) {
    warnings.push(
      `${routes.statusClasses['5xx']} server-error responses recorded since process start.`
    )
  }

  const providerFailureRate =
    sportsHttp.requests === 0
      ? 0
      : sportsHttp.upstreamFailures / sportsHttp.requests

  if (providerFailureRate >= 0.2 && sportsHttp.requests >= 5) {
    warnings.push(
      `Sports provider failure rate is ${Math.round(
        providerFailureRate * 100
      )}%.`
    )
  }

  return {
    ok: true,
    status: warnings.length === 0 ? 'ok' : 'degraded',
    service: 'vouchedge-backend',
    environment: env,
    uptimeMs: routes.uptimeMs,
    memory: memorySnapshot(),
    config: [],
    warnings,
    updatedAt: now.toISOString(),
  }
}

export function getMissingProductionConfig(): string[] {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
  ]

  return required.filter((key) => {
    const value = process.env[key]
    return !value || value.trim().length === 0
  })
}
