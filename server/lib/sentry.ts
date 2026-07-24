import * as Sentry from "@sentry/node";
import type { Express, Request, Response, NextFunction, ErrorRequestHandler } from "express";

/**
 * Sentry integration for the Express server.
 *
 * Server-side Sentry captures:
 *   - Unhandled exceptions in route handlers
 *   - Slow requests (performance tracing)
 *   - Stripe webhook failures
 *   - Grading job errors
 *
 * Setup:
 *   1. npm install @sentry/node
 *   2. Create a separate Sentry project for the backend (different from frontend)
 *   3. Add SENTRY_DSN to .env.local (server-side only — NEVER prefix with VITE_)
 *   4. In server.ts, call initServerSentry(app) BEFORE registerApiRoutes
 *
 * Privacy:
 *   - Server-side Sentry captures request bodies and headers by default.
 *   - Configure beforeSend to scrub auth tokens, passwords, payment info.
 *   - User IPs are captured for debugging — ensure your Privacy Policy
 *     discloses this.
 */

const SENTRY_DSN = process.env.SENTRY_DSN ?? "";
/** Prefer SENTRY_ENVIRONMENT when set (e.g. staging); falls back to NODE_ENV. */
const SENTRY_ENV = process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development";

const SENSITIVE_KEY_RE =
  /password|passwd|token|secret|api[_-]?key|authorization|cookie|email|stripe|bearer|session/i;

let initialized = false;
let missingDsnLogged = false;

export function isSentryEnabled(): boolean {
  return initialized;
}

function scrubQueryString(query: string): string {
  try {
    const params = new URLSearchParams(query.startsWith("?") ? query.slice(1) : query);
    for (const key of [...params.keys()]) {
      if (SENSITIVE_KEY_RE.test(key)) params.set(key, "[scrubbed]");
    }
    return params.toString();
  } catch {
    return "[scrubbed-query]";
  }
}

/** Deep-scrub objects/arrays used in Sentry request bodies, extras, and breadcrumbs. */
export function scrubSensitiveValue(value: unknown, depth = 0): unknown {
  if (depth > 6 || value == null) return value;
  if (Array.isArray(value)) return value.map((item) => scrubSensitiveValue(item, depth + 1));
  if (typeof value !== "object") return value;

  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SENSITIVE_KEY_RE.test(key) ? "[scrubbed]" : scrubSensitiveValue(nested, depth + 1);
  }
  return out;
}

/** Testable beforeSend scrubber — mutates and returns the event. */
export function scrubSentryEvent<T extends Record<string, any>>(event: T): T {
  const mutableEvent = event as Record<string, any>;
  if (event.request) {
    if (event.request.data != null) {
      event.request.data = scrubSensitiveValue(event.request.data);
    }
    if (typeof event.request.query_string === "string") {
      event.request.query_string = scrubQueryString(event.request.query_string);
    } else if (event.request.query_string && typeof event.request.query_string === "object") {
      event.request.query_string = scrubSensitiveValue(event.request.query_string);
    }
    if (event.request.headers) {
      const headers = { ...event.request.headers } as Record<string, unknown>;
      for (const key of Object.keys(headers)) {
        if (/authorization|cookie|x-api-key|x-cron/i.test(key)) {
          headers[key] = "[scrubbed]";
        }
      }
      event.request.headers = headers;
    }
  }

  if (Array.isArray(mutableEvent.breadcrumbs)) {
    mutableEvent.breadcrumbs = mutableEvent.breadcrumbs.map((crumb: Record<string, unknown>) => ({
      ...crumb,
      data: crumb.data != null ? scrubSensitiveValue(crumb.data) : crumb.data,
      message:
        typeof crumb.message === "string" && /apiKey=|Bearer\s+/i.test(crumb.message)
          ? "[scrubbed]"
          : crumb.message,
    }));
  }

  if (mutableEvent.extra) {
    mutableEvent.extra = scrubSensitiveValue(mutableEvent.extra);
  }

  return event;
}

export function initServerSentry(app?: Express) {
  if (initialized) return;

  if (!SENTRY_DSN) {
    if (SENTRY_ENV !== "production" && !missingDsnLogged) {
      console.log("[sentry] SENTRY_DSN not set — server error reporting disabled.");
      missingDsnLogged = true;
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENV,
    release: `vouchedge-server@${process.env.npm_package_version ?? "0.1.0-beta"}`,
    integrations: [
      // Enable HTTP requests tracing
      Sentry.httpIntegration(),
      // Enable Express middleware error capture
      ...(app ? [Sentry.expressIntegration({ app } as any)] : []),
    ],
    tracesSampleRate: SENTRY_ENV === "production" ? 0.1 : 1.0,
    profilesSampleRate: SENTRY_ENV === "production" ? 0.1 : 0,

    beforeSend(event) {
      return scrubSentryEvent(event);
    },
  });

  initialized = true;
}

/**
 * Express middleware handlers.
 *
 * Usage in server.ts:
 *
 *   import { initServerSentry, sentryRequestHandler, sentryErrorHandler } from "./server/lib/sentry";
 *   initServerSentry(app);
 *   app.use(sentryRequestHandler());
 *   // ... all your routes ...
 *   app.use(sentryErrorHandler());
 */
export const sentryRequestHandler = (Sentry as any).requestHandler
  ?? ((_req: Request, _res: Response, next: NextFunction) => next());
export const sentryErrorHandler = Sentry.expressErrorHandler;

export function mountSentryExpressErrorHandler(app: Express): void {
  if (!initialized) return;
  app.use(sentryErrorHandler() as unknown as ErrorRequestHandler);
}

export type SentryCaptureContext = {
  extra?: Record<string, unknown>;
  tags?: Record<string, string>;
  requestId?: string;
  path?: string;
  method?: string;
  userId?: string;
  code?: string;
  vouchId?: string;
};

/**
 * Capture an exception manually.
 */
export function captureException(err: Error | unknown, context?: SentryCaptureContext) {
  if (!initialized) return;
  Sentry.withScope((scope) => {
    if (context?.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        scope.setTag(key, value);
      }
    }
    // Promote first-class fields used by errorHandler / grading into tags+extras.
    // Previously only nested `tags`/`extra` were applied, so requestId/path/code were dropped.
    if (context?.requestId) scope.setTag("request_id", context.requestId);
    if (context?.method) scope.setTag("http_method", context.method);
    if (context?.path) scope.setTag("http_path", context.path);
    if (context?.code) scope.setTag("error_code", context.code);
    if (context?.userId) {
      scope.setTag("user_id", context.userId);
      scope.setUser({ id: context.userId });
    }
    if (context?.vouchId) scope.setTag("vouch_id", context.vouchId);

    const promotedExtra: Record<string, unknown> = {
      ...(context?.extra ?? {}),
    };
    if (context?.requestId) promotedExtra.requestId = context.requestId;
    if (context?.method) promotedExtra.method = context.method;
    if (context?.path) promotedExtra.path = context.path;
    if (context?.code) promotedExtra.code = context.code;
    if (context?.userId) promotedExtra.userId = context.userId;
    if (context?.vouchId) promotedExtra.vouchId = context.vouchId;
    if (Object.keys(promotedExtra).length) {
      scope.setExtras(promotedExtra);
    }

    Sentry.captureException(err);
  });
}

/**
 * Structured capture for grading pipeline failures (cron, staff, job, per-pick).
 */
export function captureGradingFailure(
  err: Error | unknown,
  context: {
    source: "cron" | "staff" | "job" | "pick" | "run";
    parlayId?: string;
    pickId?: string;
    eventId?: string;
    dryRun?: boolean;
    cron?: boolean;
    extra?: Record<string, unknown>;
  }
) {
  captureException(err, {
    tags: {
      service: "grading",
      grading_source: context.source,
      ...(context.parlayId ? { parlay_id: context.parlayId } : {}),
      ...(context.pickId ? { pick_id: context.pickId } : {}),
      ...(context.eventId ? { event_id: context.eventId } : {}),
      ...(context.cron ? { cron: "true" } : {}),
    },
    extra: {
      dryRun: context.dryRun,
      ...context.extra,
    },
  });
}

/**
 * Add a breadcrumb for non-fatal observability signals (e.g. circuit breaker open).
 */
export function addBreadcrumb(breadcrumb: {
  category: string;
  message: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, unknown>;
}) {
  if (!initialized) return;
  Sentry.addBreadcrumb({
    category: breadcrumb.category,
    message: breadcrumb.message,
    level: breadcrumb.level ?? "info",
    data: breadcrumb.data,
  });
}

/**
 * Capture a message.
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = "info") {
  if (!initialized) return;
  Sentry.captureMessage(message, level);
}

/**
 * Set the current user on the Sentry scope.
 * Called from auth middleware after profile load.
 */
export function setSentryUser(userId: string, username?: string) {
  if (!initialized) return;
  Sentry.setUser({ id: userId, username });
}

/**
 * Clear the user scope.
 */
export function clearSentryUser() {
  if (!initialized) return;
  Sentry.setUser(null);
}

/**
 * Wrap an async route handler with automatic error capture.
 *
 * Usage:
 *   router.post("/picks", requireAuth, asyncHandler(async (req, res) => {
 *     // your code
 *   }));
 */
export function asyncHandler<T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: T, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      captureException(err, {
        path: req.path,
        method: req.method,
        userId: (req as any).user?.id,
      });
      next(err);
    });
  };
}

/**
 * package.json additions:
 *
 *   "dependencies": {
 *     "@sentry/node": "^8.0.0",
 *     "@sentry/react": "^8.0.0",
 *     "posthog-js": "^1.150.0"
 *   }
 *
 * .env.local additions (server-side only — never VITE_ prefix):
 *   SENTRY_DSN=https://your-key@sentry.io/server-project-id
 *   SENTRY_ENVIRONMENT=production   # optional; defaults to NODE_ENV
 *
 * .env.local additions (client-side, VITE_ prefix OK):
 *   VITE_SENTRY_DSN=https://your-key@sentry.io/frontend-project-id
 *   VITE_SENTRY_ENV=production
 *   VITE_POSTHOG_KEY=phc_yourkey
 *   VITE_POSTHOG_HOST=https://app.posthog.com
 */
