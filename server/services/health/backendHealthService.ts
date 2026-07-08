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
  /** Fail-closed / required before shipping production traffic. */
  requiredInProduction: boolean;
  /** Needed to prove multi-instance / observability production readiness (10/10 ops). */
  requiredForProductionProof: boolean;
}

interface ProductionProofItem {
  id: string;
  label: string;
  ready: boolean;
  detail: string;
}

function configured(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

function configChecks(): ConfigCheck[] {
  const stripeConfigured = configured("STRIPE_SECRET_KEY");
  const redisConfigured =
    configured("UPSTASH_REDIS_REST_URL") && configured("UPSTASH_REDIS_REST_TOKEN");

  return [
    {
      name: "SUPABASE_URL or VITE_SUPABASE_URL",
      configured: configured("SUPABASE_URL") || configured("VITE_SUPABASE_URL"),
      requiredInProduction: true,
      requiredForProductionProof: true,
    },
    {
      name: "SUPABASE_SERVICE_ROLE_KEY",
      configured: configured("SUPABASE_SERVICE_ROLE_KEY"),
      requiredInProduction: true,
      requiredForProductionProof: true,
    },
    {
      name: "GEMINI_API_KEY",
      configured: configured("GEMINI_API_KEY"),
      requiredInProduction: false,
      requiredForProductionProof: false,
    },
    {
      name: "STRIPE_SECRET_KEY",
      configured: stripeConfigured,
      requiredInProduction: false,
      requiredForProductionProof: false,
    },
    {
      name: "STRIPE_WEBHOOK_SECRET",
      configured: configured("STRIPE_WEBHOOK_SECRET"),
      requiredInProduction: stripeConfigured,
      requiredForProductionProof: stripeConfigured,
    },
    {
      name: "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN",
      configured: redisConfigured,
      requiredInProduction: false,
      requiredForProductionProof: true,
    },
    {
      name: "CRON_SECRET",
      configured: configured("CRON_SECRET"),
      requiredInProduction: true,
      requiredForProductionProof: true,
    },
    {
      name: "SENTRY_DSN",
      configured: configured("SENTRY_DSN"),
      requiredInProduction: false,
      requiredForProductionProof: true,
    },
  ];
}

/**
 * Operator checklist for production proof (true 10/10).
 * Env-verifiable items can flip `envReady`; soak items need human verification.
 */
function productionProofChecklist(checks: ConfigCheck[]): {
  envReady: boolean;
  soakPending: ProductionProofItem[];
  items: ProductionProofItem[];
} {
  const byName = new Map(checks.map((check) => [check.name, check]));
  const redis = byName.get("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN");
  const sentry = byName.get("SENTRY_DSN");
  const cron = byName.get("CRON_SECRET");
  const stripeSecret = byName.get("STRIPE_SECRET_KEY");
  const stripeWebhook = byName.get("STRIPE_WEBHOOK_SECRET");

  const envItems: ProductionProofItem[] = [
    {
      id: "cron_secret",
      label: "CRON_SECRET set (cron fails closed in production)",
      ready: Boolean(cron?.configured),
      detail: "Verify GET /api/cron/parlays/grade-due returns 401 without Authorization Bearer CRON_SECRET; staff-only POST /api/parlays/grade-due returns 403 for non-staff users.",
    },
    {
      id: "sentry_dsn",
      label: "SENTRY_DSN configured and capturing 5xx",
      ready: Boolean(sentry?.configured),
      detail: "Confirm dependencies.sentry.enabled after boot, then trigger a handled 500 in staging and see requestId in Sentry.",
    },
    {
      id: "upstash_redis",
      label: "Upstash Redis for rate limits + HR hybrid cache",
      ready: Boolean(redis?.configured),
      detail: "Confirm dependencies.redis.mode === upstash_rest after boot; hit rate-limited routes from two instances.",
    },
    {
      id: "stripe_webhooks",
      label: "Stripe webhook secret when billing is enabled",
      ready: !Boolean(stripeSecret?.configured) || Boolean(stripeWebhook?.configured),
      detail: "If STRIPE_SECRET_KEY is set, send a signed test webhook and confirm checkout.session.completed path.",
    },
  ];

  const soakPending: ProductionProofItem[] = [
    {
      id: "db_grading_soak",
      label: "DB-backed grading fixture soak",
      ready: false,
      detail: "Seed pending picks, run grade-due against boxscores, confirm settle + grading_logs rows. Not verifiable from env alone.",
    },
    {
      id: "multi_instance_soak",
      label: "Multi-instance soak (Redis rate limit + HR cache)",
      ready: false,
      detail: "Run ≥2 app instances behind a load balancer with Upstash enabled; watch health warnings stay empty under load.",
    },
  ];

  return {
    envReady: envItems.every((item) => item.ready),
    soakPending,
    items: [...envItems, ...soakPending],
  };
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
  if (env === "production" && configured("STRIPE_SECRET_KEY") && !configured("STRIPE_WEBHOOK_SECRET")) {
    warnings.push("STRIPE_SECRET_KEY is set without STRIPE_WEBHOOK_SECRET; billing webhooks will fail closed.");
  }
  if (env === "production" && !configured("SENTRY_DSN")) {
    warnings.push("SENTRY_DSN is not configured; production exceptions will only hit stdout.");
  }
  if (env === "production" && !(configured("UPSTASH_REDIS_REST_URL") && configured("UPSTASH_REDIS_REST_TOKEN"))) {
    warnings.push("Upstash Redis is not configured; rate limits and HR board cache use single-instance memory.");
  }

  const missingProductionProof = checks.filter(
    (check) => check.requiredForProductionProof && !check.configured,
  );
  if (env === "production" && missingProductionProof.length > 0) {
    const alreadyCovered = new Set(missingProductionConfig.map((check) => check.name));
    const proofOnly = missingProductionProof.filter((check) => !alreadyCovered.has(check.name));
    if (proofOnly.length > 0) {
      warnings.push(
        `Missing production-proof config (multi-instance / observability): ${proofOnly.map((check) => check.name).join(", ")}.`,
      );
    }
  }

  const productionProof = productionProofChecklist(checks);
  if (env === "production" && !productionProof.envReady) {
    const pending = productionProof.items
      .filter((item) => !item.ready && !productionProof.soakPending.some((soak) => soak.id === item.id))
      .map((item) => item.id);
    warnings.push(`Production proof env incomplete: ${pending.join(", ")}.`);
  }

  const status: BackendHealthStatus = warnings.length > 0 ? "degraded" : "ok";

  // GET /api/health/backend — `productionProof` is the ops checklist for true
  // multi-instance readiness. Fail-closed prod requires SUPABASE_*, CRON_SECRET,
  // and STRIPE_WEBHOOK_SECRET when billing is enabled. Set SENTRY_DSN + Upstash
  // Redis, then run grading + multi-instance soak from productionProof.soakPending.
  return {
    ok: true,
    status,
    service: "vouchedge-backend",
    environment: env,
    uptimeMs: routes.uptimeMs,
    memory: memorySnapshot(),
    config: checks,
    productionProof,
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
