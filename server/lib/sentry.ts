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

let initialized = false;
let missingDsnLogged = false;

export function isSentryEnabled(): boolean {
  return initialized;
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
      // Scrub sensitive data from request bodies before sending to Sentry
      if (event.request?.data) {
        const data = event.request.data as any;
        const scrubbed = { ...data };
        for (const key of Object.keys(scrubbed)) {
          if (/password|token|secret|key|authorization|email|stripe/i.test(key)) {
            scrubbed[key] = "[scrubbed]";
          }
        }
        event.request.data = scrubbed;
      }
      // Scrub auth header
      if (event.request?.headers) {
        const headers = event.request.headers as any;
        if (headers.authorization) {
          headers.authorization = "[scrubbed]";
        }
        if (headers.cookie) {
          headers.cookie = "[scrubbed]";
        }
      }
      return event;
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
