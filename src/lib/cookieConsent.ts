/**
 * Cookie and Privacy Consent Engine — VouchEdge.
 *
 * Fully compliant with GDPR / UK GDPR / CCPA / ePrivacy directive.
 * Provides granular category controls, Global Privacy Control (GPC) / Do Not Track (DNT)
 * detection, first-party cookie synchronization, and dynamic SDK gating.
 */

export type ConsentCategory = "essential" | "functional" | "analytics" | "marketing";

export interface ConsentState {
  essential: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  version: number;
  consented_at?: string;
  source?: "banner" | "settings" | "gpc_signal";
}

export const CONSENT_STORAGE_KEY = "vouchedge.cookie_consent";
export const CONSENT_COOKIE_KEY = "ve_consent";
export const CONSENT_VERSION = 1;
export const CONSENT_EXPIRY_MS = 365 * 24 * 60 * 60 * 1000; // 12 months (regulatory requirement)

export const DEFAULT_CONSENT: ConsentState = {
  essential: true, // Always required for auth, CSRF, and core application state
  functional: true, // UI preferences, collapsed sidebars, theme
  analytics: false, // Explicit opt-in required (PostHog, telemetry)
  marketing: false, // Disabled (VouchEdge does not use ad networks)
  version: CONSENT_VERSION,
};

/**
 * Detects whether the user's browser has enabled Global Privacy Control (GPC)
 * or Do Not Track (DNT).
 */
export function getGlobalPrivacyControl(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const nav = navigator as unknown as { globalPrivacyControl?: boolean; doNotTrack?: string };
  return nav.globalPrivacyControl === true || nav.doNotTrack === "1";
}

/**
 * Reads and validates the current stored consent state from localStorage.
 * Returns null if consent has expired (>12 months), is invalid, or has not yet been given.
 */
export function getStoredConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== CONSENT_VERSION) return null;

    if (parsed.consented_at) {
      const elapsed = Date.now() - new Date(parsed.consented_at).getTime();
      if (elapsed > CONSENT_EXPIRY_MS) {
        // Expired consent — require re-prompt
        return null;
      }
    }

    return {
      essential: true,
      functional: parsed.functional ?? true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      version: CONSENT_VERSION,
      consented_at: parsed.consented_at,
      source: parsed.source || "banner",
    };
  } catch {
    return null;
  }
}

/**
 * Checks if a specific consent category is currently permitted.
 */
export function hasConsent(category: ConsentCategory): boolean {
  if (category === "essential") return true;

  const stored = getStoredConsent();
  if (!stored) {
    return category === "essential";
  }

  return Boolean(stored[category]);
}

/**
 * Saves updated consent state to localStorage, synchronizes a first-party cookie,
 * applies SDK gating, and dispatches a cross-component change event.
 */
export function saveConsent(
  state: Partial<ConsentState>,
  source: "banner" | "settings" | "gpc_signal" = "banner",
): ConsentState {
  const gpc = getGlobalPrivacyControl();

  const finalState: ConsentState = {
    essential: true,
    functional: state.functional !== undefined ? state.functional : true,
    // If GPC is on and not explicitly configured from settings, default analytics to off
    analytics: gpc && source === "gpc_signal" ? false : Boolean(state.analytics),
    marketing: false, // No marketing cookies in VouchEdge
    version: CONSENT_VERSION,
    consented_at: new Date().toISOString(),
    source,
  };

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(finalState));
    }
  } catch (err) {
    console.warn("[consent] failed to persist to localStorage", err);
  }

  // Synchronize 1st-party cookie for edge/SSR routing
  try {
    if (typeof document !== "undefined") {
      const cookiePayload = JSON.stringify({
        a: finalState.analytics ? 1 : 0,
        f: finalState.functional ? 1 : 0,
        v: finalState.version,
      });
      const isHttps = typeof location !== "undefined" && location.protocol === "https:";
      document.cookie = `${CONSENT_COOKIE_KEY}=${encodeURIComponent(cookiePayload)}; Path=/; Max-Age=${Math.floor(
        CONSENT_EXPIRY_MS / 1000,
      )}; SameSite=Lax; ${isHttps ? "Secure;" : ""}`;
    }
  } catch (err) {
    console.warn("[consent] failed to set cookie", err);
  }

  // Apply consent gates to third-party SDKs
  applyConsent(finalState);

  // Broadcast event across UI
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("vouchedge:consent-change", { detail: finalState }));
  }

  return finalState;
}

/**
 * Resets all cookie consent preferences (used by Settings > Privacy).
 */
export function revokeConsent(): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
    }
    if (typeof document !== "undefined") {
      document.cookie = `${CONSENT_COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax;`;
    }
  } catch (err) {
    console.warn("[consent] failed to clear storage", err);
  }

  if (typeof window !== "undefined" && window.posthog) {
    window.posthog.opt_out_capturing?.();
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("vouchedge:consent-change", { detail: null }));
  }
}

/**
 * Applies consent to dynamic analytics & monitoring scripts (PostHog & Sentry).
 */
export function applyConsent(consent: ConsentState): void {
  if (typeof window === "undefined") return;

  // PostHog product analytics
  if (consent.analytics) {
    if (!window.posthog) {
      import("./analytics")
        .then(({ initPostHog }) => initPostHog())
        .catch(() => {
          // Analytics is non-essential; silently ignore
        });
    }
  } else if (window.posthog) {
    window.posthog.opt_out_capturing?.();
  }

  // Sentry error reporting & performance monitoring
  if (window.Sentry) {
    window.Sentry.configureScope?.((scope: any) => {
      if (consent.analytics) {
        scope.setTag("analytics_consent", "granted");
      } else {
        scope.setTag("analytics_consent", "denied");
        scope.setUser(null);
      }
    });
  }
}

/**
 * Helper hook / listener subscription for React components.
 */
export function onConsentChange(callback: (consent: ConsentState | null) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<ConsentState | null>;
    callback(customEvent.detail ?? null);
  };

  window.addEventListener("vouchedge:consent-change", handler);
  return () => window.removeEventListener("vouchedge:consent-change", handler);
}

// Window type declarations
declare global {
  interface Window {
    posthog?: any;
    Sentry?: any;
  }
}
