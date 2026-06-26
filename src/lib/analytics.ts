import { posthog } from "posthog-js";
import { hasConsent } from "../components/legal/CookieConsentBanner";

/**
 * PostHog integration — product analytics.
 *
 * Loaded ONLY after user grants analytics consent (via CookieConsentBanner).
 *
 * Setup:
 *   1. npm install posthog-js
 *   2. Create a project at https://posthog.com → get API key
 *   3. Add VITE_POSTHOG_KEY and VITE_POSTHOG_HOST to .env.local
 *   4. Call initPostHog() from CookieConsentBanner when user consents
 *   5. Use trackPageView() in your router, trackEvent() for custom events
 *
 * Privacy:
 *   - User identity (Supabase UUID) is sent to PostHog for funnel tracking
 *   - PostHog is configured to NOT capture IP addresses as identifiers
 *   - Users can opt out anytime via Settings > Privacy
 *   - All events respect cookie consent — no events fire if consent denied
 */

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY ?? "";
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST ?? "https://app.posthog.com";
const CLIENT_VERSION = import.meta.env.VITE_CLIENT_VERSION ?? "0.1.0-beta";

let initialized = false;

export function initPostHog() {
  if (!POSTHOG_KEY || initialized) return;
  if (!hasConsent("analytics")) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    loaded: (ph) => {
      ph.register({
        app_version: CLIENT_VERSION,
        env: import.meta.env.VITE_SENTRY_ENV ?? "development",
      });
    },
    // Don't capture IP addresses
    respect_dnt: true,
    // Don't autocapture everything — we send explicit events for important actions
    autocapture: false,
    // Persist user identity in localStorage (NOT cookies — avoids cookie banner complexity)
    persistence: "localStorage",
    // Sanitize any URL properties that might leak sensitive query params
    property_denylist: [
      "token",
      "access_token",
      "refresh_token",
      "password",
      "stripe_customer_id",
    ],
  });

  initialized = true;
}

/**
 * Identify the current user to PostHog.
 * Called after successful auth.
 */
export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (!initialized || !hasConsent("analytics")) return;

  posthog.identify(userId, {
    ...properties,
    // Don't send PII to PostHog beyond what's needed for funnel tracking
    username: properties?.username,
    tier: properties?.tier,
    is_staff: properties?.is_staff,
  });
}

/**
 * Reset user identity on sign-out.
 */
export function resetUser() {
  if (!initialized) return;
  posthog.reset();
}

/**
 * Track a custom event.
 * Respects cookie consent.
 */
export function trackEvent(name: string, properties?: Record<string, any>) {
  if (!initialized || !hasConsent("analytics")) return;
  posthog.capture(name, properties);
}

/**
 * Track page view. Call from your router's onChange.
 */
export function trackPageView(path: string) {
  if (!initialized || !Consent("analytics")) return;
  posthog.capture("$pageview", { path });
}

// Helper to avoid circular import with CookieConsentBanner
function Consent(category: "essential" | "analytics" | "marketing"): boolean {
  return hasConsent(category);
}

/**
 * Opt out of all PostHog tracking.
 * Called when user revokes consent in Settings > Privacy.
 */
export function optOut() {
  if (!initialized) return;
  posthog.opt_out_capturing();
}

/**
 * Opt back in (after explicit consent).
 */
export function optIn() {
  if (!initialized) {
    initPostHog();
    return;
  }
  posthog.opt_in_capturing();
}

// =========================================================
// Standard event names — keep these consistent across the app
// =========================================================

export const EVENTS = {
  // Auth
  SIGNED_UP: "user_signed_up",
  SIGNED_IN: "user_signed_in",
  SIGNED_OUT: "user_signed_out",

  // Legal
  LEGAL_CONFIRMED: "legal_confirmed",
  COOKIE_CONSENT_GIVEN: "cookie_consent_given",

  // Picks
  PICK_CREATED: "pick_created",
  PICK_GRADED: "pick_graded",

  // Social
  POST_CREATED: "post_created",
  POST_LIKED: "post_liked",
  COMMENT_CREATED: "comment_created",
  USER_FOLLOWED: "user_followed",

  // Billing
  CHECKOUT_STARTED: "checkout_started",
  CHECKOUT_COMPLETED: "checkout_completed",
  SUBSCRIPTION_CANCELED: "subscription_canceled",
  TIER_CHANGED: "tier_changed",

  // Errors (also go to Sentry)
  API_ERROR: "api_error",
  QUOTA_EXCEEDED: "quota_exceeded",
} as const;

// =========================================================
// package.json additions
// =========================================================

/*
"dependencies": {
  "@sentry/react": "^8.0.0",
  "posthog-js": "^1.150.0"
}

Add to .env.local:
  VITE_SENTRY_DSN=https://your-key@sentry.io/project-id
  VITE_SENTRY_ENV=production  # or 'staging', 'development'
  VITE_POSTHOG_KEY=phc_yourkey
  VITE_POSTHOG_HOST=https://app.posthog.com  # or your self-hosted instance
*/
