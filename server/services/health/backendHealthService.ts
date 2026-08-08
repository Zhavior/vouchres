// Titan backend health report — staff-facing operational snapshot.
//
// This module was previously replaced with an "abridged" stub that dropped
// dependencies/api/cache/config/productionProof from the response. The tests in
// tests/backendHealthService.test.ts describe the real contract; they went red
// and stayed red. Restored here, plus a Redis write-capability warning so the
// 2026-08-05 read-only-token failure is visible on the health surface.
import { getRouteMetricsSnapshot } from '../../lib/observability/routeMetrics'
import { getSportsHttpStats } from '../../lib/sports/sportsHttpClient'
import { isSentryEnabled } from '../../lib/sentry'
import { isUpstashEnabled } from '../../lib/upstashRedis'
import { getRedisCapability } from '../../lib/redisCapability'
import {
  gameFeedCache,
  reportCache,
  scheduleCache,
} from '../mlb/mlbCache'
import { getHrBoardCacheStats } from '../mlb/hrPipeline'

export interface ConfigCheck {
  name: string
  present: boolean
  requiredInProduction: boolean
  requiredForProductionProof: boolean
  detail?: string
}

export interface ProductionProofItem {
  id: string
  label: string
  ready: boolean
  detail: string
}

export interface ProductionProof {
  envReady: boolean
  items: ProductionProofItem[]
  soakPending: ProductionProofItem[]
}

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
  dependencies: {
    redis: {
      enabled: boolean
      mode: 'upstash' | 'memory_fallback'
      writeCapable: boolean | null
      lastCheckedAt: string | null
    }
    sentry: {
      enabled: boolean
      configured: boolean
    }
    sportsHttp: ReturnType<typeof getSportsHttpStats>
  }
  api: ReturnType<typeof getRouteMetricsSnapshot>
  cache: {
    mlbSchedule: ReturnType<typeof scheduleCache.getStats>
    mlbLiveFeed: ReturnType<typeof gameFeedCache.getStats>
    mlbDailyReport: ReturnType<typeof reportCache.getStats>
    hrValidatedBoard: ReturnType<typeof getHrBoardCacheStats>
  }
  config: ConfigCheck[]
  productionProof: ProductionProof
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

function envPresent(name: string): boolean {
  return Boolean(process.env[name]?.trim())
}

function isStripeConfigured(): boolean {
  return envPresent('STRIPE_SECRET_KEY')
}

function getConfigChecks(): ConfigCheck[] {
  const stripeConfigured = isStripeConfigured()

  return [
    {
      name: 'SUPABASE_URL',
      present: envPresent('SUPABASE_URL') || envPresent('VITE_SUPABASE_URL'),
      requiredInProduction: true,
      requiredForProductionProof: true,
    },
    {
      name: 'SUPABASE_SERVICE_ROLE_KEY',
      present: envPresent('SUPABASE_SERVICE_ROLE_KEY'),
      requiredInProduction: true,
      requiredForProductionProof: true,
    },
    {
      name: 'CRON_SECRET',
      present: envPresent('CRON_SECRET'),
      requiredInProduction: true,
      requiredForProductionProof: true,
      detail: 'Cron endpoints fail closed without it.',
    },
    {
      name: 'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN',
      present: envPresent('UPSTASH_REDIS_REST_URL') && envPresent('UPSTASH_REDIS_REST_TOKEN'),
      requiredInProduction: true,
      requiredForProductionProof: true,
      detail: 'Presence only — see dependencies.redis.writeCapable for whether the token can write.',
    },
    {
      name: 'SENTRY_DSN',
      present: envPresent('SENTRY_DSN'),
      requiredInProduction: true,
      requiredForProductionProof: true,
      detail: 'Server-side DSN. VITE_SENTRY_DSN does not satisfy this.',
    },
    {
      name: 'STRIPE_SECRET_KEY',
      present: stripeConfigured,
      requiredInProduction: false,
      requiredForProductionProof: false,
      detail: 'Optional — billing is disabled without it.',
    },
    {
      name: 'STRIPE_WEBHOOK_SECRET',
      present: envPresent('STRIPE_WEBHOOK_SECRET'),
      requiredInProduction: stripeConfigured,
      requiredForProductionProof: false,
      detail: 'Required once STRIPE_SECRET_KEY is set.',
    },
  ]
}

function getProductionProof(): ProductionProof {
  const stripeConfigured = isStripeConfigured()

  const items: ProductionProofItem[] = [
    {
      id: 'supabase_url',
      label: 'Supabase URL',
      ready: envPresent('SUPABASE_URL') || envPresent('VITE_SUPABASE_URL'),
      detail: 'Database endpoint for server-side reads and writes.',
    },
    {
      id: 'supabase_service_role_key',
      label: 'Supabase service role key',
      ready: envPresent('SUPABASE_SERVICE_ROLE_KEY'),
      detail: 'Server-side privileged access for grading and admin paths.',
    },
    {
      id: 'cron_secret',
      label: 'Cron secret',
      ready: envPresent('CRON_SECRET'),
      detail: 'Cron endpoints deny all requests when unset.',
    },
    {
      id: 'upstash_redis',
      label: 'Upstash Redis credentials',
      ready: envPresent('UPSTASH_REDIS_REST_URL') && envPresent('UPSTASH_REDIS_REST_TOKEN'),
      detail: 'Shared rate-limit counters and L2 cache.',
    },
    {
      id: 'sentry_dsn',
      label: 'Sentry DSN (server)',
      ready: envPresent('SENTRY_DSN'),
      detail: 'Server error capture. VITE_SENTRY_DSN is the client DSN and does not count.',
    },
    {
      id: 'stripe_webhook',
      label: 'Stripe webhook secret',
      ready: !stripeConfigured || envPresent('STRIPE_WEBHOOK_SECRET'),
      detail: stripeConfigured
        ? 'Required because STRIPE_SECRET_KEY is set.'
        : 'Not required — Stripe billing is disabled.',
    },
  ]

  // Soak gates are proven by running the system, not by reading env vars, so
  // they stay pending until a soak run records evidence.
  const soakPending: ProductionProofItem[] = [
    {
      id: 'db_grading_soak',
      label: 'Database grading soak',
      ready: false,
      detail: 'Grading has not been soaked against production-scale data volumes.',
    },
    {
      id: 'multi_instance_soak',
      label: 'Multi-instance soak',
      ready: false,
      detail:
        'Shared-state behaviour (rate limits, grading locks) unverified across more than one instance.',
    },
    {
      id: 'upstream_fallback_coverage',
      label: 'Upstream fallback coverage',
      ready: false,
      detail:
        'Redis L2 fallback coverage unverified for HR board hub, HR feed, daily report, ' +
        'live at-bat and lineup board reads.',
    },
  ]

  return {
    envReady: items.every((item) => item.ready),
    items,
    soakPending,
  }
}

export function getBackendHealthReport(now = new Date()): BackendHealthStatus {
  const env = process.env.NODE_ENV || 'development'
  const isProduction = env === 'production'
  const routes = getRouteMetricsSnapshot(now)
  const sportsHttp = getSportsHttpStats()
  const redisCapability = getRedisCapability()
  const config = getConfigChecks()
  const productionProof = getProductionProof()

  const warnings: string[] = []

  // Config warnings are production-only: a local dev box legitimately runs
  // without Redis, Sentry or Stripe and should still report healthy.
  if (isProduction) {
    const missing = getMissingProductionConfig()
    if (missing.length > 0) {
      warnings.push(`Missing required production config: ${missing.join(', ')}.`)
    }

    if (isStripeConfigured() && !envPresent('STRIPE_WEBHOOK_SECRET')) {
      warnings.push(
        'STRIPE_WEBHOOK_SECRET is required when STRIPE_SECRET_KEY is set; webhooks will fail verification.',
      )
    }

    if (!productionProof.envReady) {
      warnings.push('Production proof env incomplete.')
    }

    if (!isUpstashEnabled()) {
      warnings.push('Redis is not configured; running with in-memory fallback.')
    }

    if (!isSentryEnabled()) {
      warnings.push('Sentry is not configured; errors will not be reported.')
    }
  }

  // Presence is not capability — a read-only token passes every check above and
  // then fails every INCR at request time.
  if (redisCapability?.configured && !redisCapability.canWrite) {
    warnings.push(
      `Redis is configured but cannot write (${redisCapability.error ?? 'unknown error'}); ` +
        'rate limiting and cache writes are broken.',
    )
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
    dependencies: {
      redis: {
        enabled: isUpstashEnabled(),
        mode: isUpstashEnabled() ? 'upstash' : 'memory_fallback',
        writeCapable: redisCapability?.configured ? redisCapability.canWrite : null,
        lastCheckedAt: redisCapability?.checkedAt ?? null,
      },
      sentry: {
        enabled: isSentryEnabled(),
        configured: envPresent('SENTRY_DSN'),
      },
      sportsHttp,
    },
    api: routes,
    cache: {
      mlbSchedule: scheduleCache.getStats(),
      mlbLiveFeed: gameFeedCache.getStats(),
      mlbDailyReport: reportCache.getStats(),
      hrValidatedBoard: getHrBoardCacheStats(),
    },
    config,
    productionProof,
    warnings,
    updatedAt: now.toISOString(),
  }
}

export function getMissingProductionConfig(): string[] {
  const missing: string[] = []

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl.trim().length === 0) {
    missing.push('SUPABASE_URL')
  }

  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseKey || supabaseKey.trim().length === 0) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY')
  }

  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || cronSecret.trim().length === 0) {
    missing.push('CRON_SECRET')
  }

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!upstashUrl || upstashUrl.trim().length === 0 || !upstashToken || upstashToken.trim().length === 0) {
    missing.push('UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN')
  }

  const sentryDsn = process.env.SENTRY_DSN
  if (!sentryDsn || sentryDsn.trim().length === 0) {
    missing.push('SENTRY_DSN')
  }

  return missing
}
