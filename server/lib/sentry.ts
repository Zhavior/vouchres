import * as Sentry from "@sentry/node";
import type { Express, Request, Response, NextFunction } from "express";

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
const SENTRY_ENV = process.env.NODE_ENV ?? "development";

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
export const sentryRequestHandler = (Sentry as any).requestHandler ?? ((req: any, res: any, next: any) => next());
export const sentryErrorHandler = Sentry.expressErrorHandler;

/**
 * Capture an exception manually.
 */
export function captureException(err: Error | unknown, context?: Record<string, any>) {
  if (!initialized) return;
  Sentry.captureException(err, { extra: context });
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
 *
 * .env.local additions (client-side, VITE_ prefix OK):
 *   VITE_SENTRY_DSN=https://your-key@sentry.io/frontend-project-id
 *   VITE_SENTRY_ENV=production
 *   VITE_POSTHOG_KEY=phc_yourkey
 *   VITE_POSTHOG_HOST=https://app.posthog.com
 */
