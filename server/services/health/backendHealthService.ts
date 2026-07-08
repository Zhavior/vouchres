import { getRouteMetricsSnapshot } from "../../lib/observability/routeMetrics";
import { getSportsHttpStats } from "../../lib/sports/sportsHttpClient";
import { isSentryEnabled } from "../../lib/sentry";
import { isUpstashEnabled } from "../../lib/upstashRedis";
import { gameFeedCache, reportCache, scheduleCache } from "../mlb/mlbCache";
import { getHrBoardCacheStats } from "../mlb/hrPipeline";

type BackendHealthStatus = "ok" | "degraded";

interface ConfigCheck {
  name: string;
  configured: boolean;
  requiredInProduction: boolean;
}

function configured(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

function configChecks(): ConfigCheck[] {
  return [
    {
      name: "SUPABASE_URL or VITE_SUPABASE_URL",
      configured: configured("SUPABASE_URL") || configured("VITE_SUPABASE_URL"),
      requiredInProduction: true,
    },
    {
      name: "SUPABASE_SERVICE_ROLE_KEY",
      configured: configured("SUPABASE_SERVICE_ROLE_KEY"),
      requiredInProduction: true,
    },
    {
      name: "GEMINI_API_KEY",
      configured: configured("GEMINI_API_KEY"),
      requiredInProduction: false,
    },
    {
      name: "STRIPE_SECRET_KEY",
      configured: configured("STRIPE_SECRET_KEY"),
      requiredInProduction: false,
    },
    {
      name: "STRIPE_WEBHOOK_SECRET",
      configured: configured("STRIPE_WEBHOOK_SECRET"),
      requiredInProduction: false,
    },
    {
      name: "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN",
      configured: configured("UPSTASH_REDIS_REST_URL") && configured("UPSTASH_REDIS_REST_TOKEN"),
      requiredInProduction: false,
    },
    {
      name: "CRON_SECRET",
      configured: configured("CRON_SECRET"),
      requiredInProduction: true,
    },
    {
      name: "SENTRY_DSN",
      configured: configured("SENTRY_DSN"),
      requiredInProduction: false,
    },
  ];
}

function memorySnapshot() {
  const memory = process.memoryUsage();
  return {
    rssMb: Math.round(memory.rss / 1024 / 1024),
    heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
    heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
    externalMb: Math.round(memory.external / 1024 / 1024),
  };
}

export function getBackendHealthReport(now = new Date()) {
  const env = process.env.NODE_ENV || "development";
  const checks = configChecks();
  const missingProductionConfig = env === "production"
    ? checks.filter((check) => check.requiredInProduction && !check.configured)
    : [];

  const routes = getRouteMetricsSnapshot(now);
  const sportsHttp = getSportsHttpStats();
  const providerFailureRate = sportsHttp.requests > 0
    ? sportsHttp.upstreamFailures / sportsHttp.requests
    : 0;

  const warnings: string[] = [];
  if (missingProductionConfig.length > 0) {
    warnings.push(`Missing required production config: ${missingProductionConfig.map((check) => check.name).join(", ")}.`);
  }
  if (routes.statusClasses["5xx"] > 0) {
    warnings.push(`${routes.statusClasses["5xx"]} server-error API responses recorded since process start.`);
  }
  if (providerFailureRate >= 0.2 && sportsHttp.requests >= 5) {
    warnings.push(`Sports provider failure rate is ${Math.round(providerFailureRate * 100)}%.`);
  }
  if (env === "production" && !configured("SENTRY_DSN")) {
    warnings.push("SENTRY_DSN is not configured; production exceptions will only hit stdout.");
  }
  if (env === "production" && !(configured("UPSTASH_REDIS_REST_URL") && configured("UPSTASH_REDIS_REST_TOKEN"))) {
    warnings.push("Upstash Redis is not configured; rate limits and HR board cache use single-instance memory.");
  }

  const status: BackendHealthStatus = warnings.length > 0 ? "degraded" : "ok";

  return {
    ok: true,
    status,
    service: "vouchedge-backend",
    environment: env,
    uptimeMs: routes.uptimeMs,
    memory: memorySnapshot(),
    config: checks,
    dependencies: {
      redis: {
        enabled: isUpstashEnabled(),
        mode: isUpstashEnabled() ? "upstash_rest" : "memory_fallback",
      },
      sentry: {
        enabled: isSentryEnabled(),
        configured: configured("SENTRY_DSN"),
      },
      sportsHttp,
    },
    cache: {
      mlbSchedule: scheduleCache.getStats(),
      mlbLiveFeed: gameFeedCache.getStats(),
      mlbReports: reportCache.getStats(),
      hrValidatedBoard: getHrBoardCacheStats(),
    },
    api: routes,
    warnings,
    updatedAt: now.toISOString(),
  };
}
