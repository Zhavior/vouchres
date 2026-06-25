import { useEffect, useState } from "react";

/**
 * CookieConsentBanner — GDPR/UK GDPR/ePrivacy compliance.
 *
 * Required for any user in the EU, UK, or Switzerland. Shows a banner on
 * first visit asking for consent to non-essential cookies/storage.
 *
 * Categories:
 *   - essential:    Always on. Auth session, theme, draft content. Cannot be disabled.
 *   - analytics:    PostHog / Sentry. Off by default until user opts in.
 *   - marketing:    None currently (we don't run ads). Off by default.
 *
 * Storage:
 *   - Consent stored in localStorage key "vouchedge.cookie_consent"
 *   - Re-prompt after 12 months (regulatory best practice)
 *   - User can change preferences anytime via /settings#privacy
 *
 * Geofencing:
 *   - For MVP, show to ALL users. EU/UK law requires it for EU/UK users;
 *     US users won't be harmed by seeing it.
 *   - For tighter targeting later, integrate a GeoIP lookup at the edge
 *     (Cloudflare Worker / Vercel Edge Middleware) and only show in EU/UK.
 */

type ConsentCategory = "essential" | "analytics" | "marketing";
type ConsentState = Partial<Record<ConsentCategory, boolean>> & {
  consented_at?: string;
  version?: number;
};

const CONSENT_KEY = "vouchedge.cookie_consent";
const CONSENT_VERSION = 1;
const CONSENT_EXPIRY_MS = 365 * 24 * 60 * 60 * 1000; // 12 months

const DEFAULT_CONSENT: ConsentState = {
  essential: true, // always true
  analytics: false,
  marketing: false,
};

export function CookieConsentBanner() {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [showDetailed, setShowDetailed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ConsentState;
        // Check version + expiry
        if (
          parsed.version === CONSENT_VERSION &&
          parsed.consented_at &&
          Date.now() - new Date(parsed.consented_at).getTime() < CONSENT_EXPIRY_MS
        ) {
          setConsent(parsed);
          // Apply consent immediately on load
          applyConsent(parsed);
          return;
        }
      }
    } catch {
      // Corrupted storage — treat as no consent
    }
    setConsent(null);
  }, []);

  function saveConsent(state: ConsentState) {
    const full: ConsentState = {
      ...state,
      essential: true, // always
      consented_at: new Date().toISOString(),
      version: CONSENT_VERSION,
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(full));
    setConsent(full);
    applyConsent(full);
  }

  function handleAcceptAll() {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
    });
  }

  function handleRejectAll() {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
    });
  }

  function handleSaveDetailed(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    saveConsent({
      essential: true,
      analytics: formData.get("analytics") === "on",
      marketing: formData.get("marketing") === "on",
    });
  }

  // Already consented (or expired consent re-prompted) — don't show banner
  if (consent) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-live="polite" aria-label="Cookie consent">
      {!showDetailed ? (
        <div className="cookie-banner__simple">
          <div className="cookie-banner__text">
            <strong>We value your privacy.</strong>
            <p>
              We use essential cookies to keep you logged in and remember your
              preferences. With your consent, we also use analytics cookies to
              understand how VouchEdge is used and improve the service. We never
              sell your data or use advertising cookies. See our{" "}
              <a href="/privacy">Privacy Policy</a>.
            </p>
          </div>
          <div className="cookie-banner__actions">
            <button onClick={handleRejectAll} className="cookie-banner__btn cookie-banner__btn--secondary">
              Reject non-essential
            </button>
            <button onClick={() => setShowDetailed(true)} className="cookie-banner__btn cookie-banner__btn--secondary">
              Customize
            </button>
            <button onClick={handleAcceptAll} className="cookie-banner__btn cookie-banner__btn--primary">
              Accept all
            </button>
          </div>
        </div>
      ) : (
        <form className="cookie-banner__detailed" onSubmit={handleSaveDetailed}>
          <h3>Cookie preferences</h3>

          <label className="cookie-banner__category cookie-banner__category--required">
            <div>
              <strong>Essential</strong>
              <p>
                Required for login, theme selection, and draft content. Cannot
                be disabled.
              </p>
            </div>
            <input type="checkbox" checked disabled />
          </label>

          <label className="cookie-banner__category">
            <div>
              <strong>Analytics</strong>
              <p>
                Anonymous usage data via PostHog (if enabled). Helps us
                understand which features are used and find bugs.
              </p>
            </div>
            <input type="checkbox" name="analytics" defaultChecked={false} />
          </label>

          <label className="cookie-banner__category">
            <div>
              <strong>Marketing</strong>
              <p>
                We do not currently use marketing cookies. If we add them in
                the future, you'll be re-prompted.
              </p>
            </div>
            <input type="checkbox" name="marketing" disabled />
          </label>

          <div className="cookie-banner__actions">
            <button type="button" onClick={() => setShowDetailed(false)} className="cookie-banner__btn cookie-banner__btn--secondary">
              Back
            </button>
            <button type="submit" className="cookie-banner__btn cookie-banner__btn--primary">
              Save preferences
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/**
 * Apply consent — enable/disable analytics scripts based on user preference.
 *
 * Called on mount (if consent already given) and after a new consent save.
 *
 * For PostHog: load the script only if analytics consent is true.
 * For Sentry: loaded unconditionally for error tracking (legitimate interest
 * under GDPR Art. 6(1)(f)) — but user data is scrubbed unless consent given.
 */
function applyConsent(consent: ConsentState) {
  // PostHog — only load if analytics consent given
  if (consent.analytics && !window.posthog) {
    initPostHog();
  } else if (!consent.analytics && window.posthog) {
    // If user revoked consent, opt out of tracking
    window.posthog.opt_out_capturing?.();
  }

  // Sentry — always loaded (legitimate interest for security), but
  // adjust PII scrubbing based on consent
  if (window.Sentry) {
    if (consent.analytics) {
      window.Sentry.configureScope?.((scope: any) => {
        scope.setTag("analytics_consent", "granted");
      });
    } else {
      window.Sentry.configureScope?.((scope: any) => {
        scope.setTag("analytics_consent", "denied");
        // Scrub user info if consent denied
        scope.setUser(null);
      });
    }
  }
}

/**
 * Lazy-init PostHog. Real implementation in src/lib/analytics.ts.
 */
function initPostHog() {
  // Defer to src/lib/analytics.ts — see that file for the actual init.
  // This indirection keeps the cookie banner free of analytics SDK deps.
  import("../../lib/analytics")
    .then(({ initPostHog: init }) => init())
    .catch(() => {
      // Analytics is non-essential — silently ignore init failures
    });
}

/**
 * Helper for other code to check current consent state.
 * Usage: `if (hasConsent("analytics")) { posthog.capture(...) }`
 */
export function hasConsent(category: ConsentCategory): boolean {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return category === "essential" ? true : false;
    const parsed = JSON.parse(stored) as ConsentState;
    return parsed[category] === true;
  } catch {
    return category === "essential" ? true : false;
  }
}

/**
 * Revoke consent — used in Settings > Privacy to reset preferences.
 */
export function revokeConsent() {
  localStorage.removeItem(CONSENT_KEY);
  if (window.posthog) {
    window.posthog.opt_out_capturing?.();
  }
  // Reload to reset analytics state
  window.location.reload();
}

// Type augmentation for window — PostHog and Sentry are loaded by their
// respective scripts in src/lib/analytics.ts and src/lib/sentry.ts
declare global {
  interface Window {
    posthog?: any;
    Sentry?: any;
  }
}
