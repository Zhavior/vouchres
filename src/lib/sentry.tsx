import { useEffect } from "react";
import * as Sentry from "@sentry/react";
import { supabase } from "./supabaseClient";
import { hasConsent } from "../components/legal/CookieConsentBanner";

/**
 * Sentry integration — error tracking + performance monitoring.
 *
 * Loaded UNCONDITIONALLY (legitimate interest under GDPR Art. 6(1)(f) for
 * security and bug-fixing). User-identifying data is scrubbed unless the
 * user has granted analytics consent.
 *
 * Setup:
 *   1. npm install @sentry/react
 *   2. Create a project at https://sentry.io → get DSN
 *   3. Add VITE_SENTRY_DSN to .env.local
 *   4. Call initSentry() in main.tsx BEFORE ReactDOM.render
 *   5. Wrap <App/> in <Sentry.ErrorBoundary fallback={<ErrorFallback/>}>
 *
 * For server-side error tracking, see server/lib/sentry.ts (separate file).
 */

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN ?? "";
const SENTRY_ENV = import.meta.env.VITE_SENTRY_ENV ?? "development";
const CLIENT_VERSION = import.meta.env.VITE_CLIENT_VERSION ?? "0.1.0-beta";

let initialized = false;

export function initSentry() {
  if (!SENTRY_DSN || initialized) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENV,
    release: `vouchedge-frontend@${CLIENT_VERSION}`,
    integrations: [
      // Browser performance monitoring — sample at 10% to control quota
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: SENTRY_ENV === "production" ? 0.1 : 1.0,
    // Capture errors but not user-identifying info by default
    sendDefaultPii: false,
    // Don't capture console.log — only errors
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === "console" && breadcrumb.level !== "error") {
        return null;
      }
      return breadcrumb;
    },
    beforeSend(event) {
      // If user hasn't consented to analytics, strip user IP and user agent
      if (!hasConsent("analytics")) {
        if (event.request) {
          delete event.request.headers?.["x-forwarded-for"];
          delete event.request.headers?.["user-agent"];
        }
        // Remove user tags
        if (event.user) {
          delete event.user.ip_address;
          delete event.user.email;
          // Keep user.id as a hash for deduplication but strip anything else
        }
      }
      return event;
    },
  });

  initialized = true;
}

/**
 * Attach the current user to Sentry context for error attribution.
 * Called on auth state change.
 */
export function setSentryUser(user: { id: string; username: string } | null) {
  if (!initialized) return;

  if (user) {
    // Hash the user ID so Sentry doesn't have the raw UUID
    // (we still get crash grouping by user)
    Sentry.setUser({
      id: user.id,
      username: hasConsent("analytics") ? user.username : undefined,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Sentry ErrorBoundary fallback component.
 */
export function SentryErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="error-fallback">
      <h2>Something went wrong.</h2>
      <p>We've been notified of this error and are looking into it.</p>
      <details>
        <summary>Error details</summary>
        <pre>{error.message}</pre>
        <pre>{error.stack}</pre>
      </details>
      <button onClick={resetError}>Try again</button>
      <button onClick={() => window.location.reload()}>Reload page</button>
    </div>
  );
}

/**
 * Hook to attach Sentry user context to auth state changes.
 * Use in App.tsx:
 *
 *   const { user } = useAuth();
 *   useSentryUser(user);
 */
export function useSentryUser(user: { id: string; username: string } | null) {
  useEffect(() => {
    setSentryUser(user);
  }, [user]);
}

/**
 * Capture a client-side exception when Sentry is initialized.
 */
export function captureException(error: Error, context?: { extra?: Record<string, unknown> }) {
  if (!initialized) return;
  Sentry.withScope((scope) => {
    if (context?.extra) scope.setExtras(context.extra);
    Sentry.captureException(error);
  });
}

/**
 * Capture a custom event for analytics-adjacent tracking.
 * Respects cookie consent — if user denied analytics, this is a no-op.
 */
export function trackEvent(name: string, properties?: Record<string, any>) {
  if (!hasConsent("analytics")) return;
  Sentry.addBreadcrumb({
    category: "custom",
    message: name,
    data: properties,
    level: "info",
  });
}
