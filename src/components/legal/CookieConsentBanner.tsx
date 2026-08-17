import { useEffect, useState } from "react";
import { Sliders, Shield, ExternalLink, Sparkles } from "lucide-react";
import {
  AuroraMaxPanel,
  AuroraMaxControl,
  AuroraMaxTruthBadge,
  AuroraMaxEyebrow,
} from "../aurora-max/AuroraMaxPrimitives";
import { AURORA_CYAN_HEX, AURORA_EMERALD_HEX } from "../../theme/auroraTokens";
import {
  getStoredConsent,
  saveConsent,
  getGlobalPrivacyControl,
  onConsentChange,
  revokeConsent,
  hasConsent,
  type ConsentCategory,
  type ConsentState,
} from "../../lib/cookieConsent";

// Re-export core consent functions for backward compatibility
export { hasConsent, revokeConsent, saveConsent, type ConsentCategory, type ConsentState };

export function CookieConsentBanner() {
  const [consent, setConsent] = useState<ConsentState | null>(() => getStoredConsent());
  const [showDetailed, setShowDetailed] = useState(false);
  const [hasGpc, setHasGpc] = useState(false);

  useEffect(() => {
    setHasGpc(getGlobalPrivacyControl());
    setConsent(getStoredConsent());

    // Listen to changes across tabs or other settings surfaces
    const unsubscribe = onConsentChange((next) => {
      setConsent(next);
    });

    return unsubscribe;
  }, []);

  const handleAcceptAll = () => {
    const updated = saveConsent({
      essential: true,
      functional: true,
      analytics: true,
      marketing: false,
    }, "banner");
    setConsent(updated);
  };

  const handleRejectAll = () => {
    const updated = saveConsent({
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
    }, "banner");
    setConsent(updated);
  };

  const handleSaveDetailed = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updated = saveConsent({
      essential: true,
      functional: formData.get("functional") === "on",
      analytics: formData.get("analytics") === "on",
      marketing: false,
    }, "banner");
    setConsent(updated);
  };

  // If valid consent is already stored, do not render banner HUD
  if (consent) return null;

  return (
    <aside
      className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-1.5rem)] max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
      role="dialog"
      aria-live="polite"
      aria-label="Cookie and Privacy Consent"
    >
      <AuroraMaxPanel className="p-4 sm:p-5 border border-white/15 bg-black/85 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.8),0_0_24px_rgba(0,217,160,0.12)]">
        {!showDetailed ? (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white">
                  <Shield className="h-3.5 w-3.5" style={{ color: AURORA_CYAN_HEX }} />
                </div>
                <div>
                  <AuroraMaxEyebrow className="text-[10px]">PRIVACY & TRUST</AuroraMaxEyebrow>
                  <p className="text-xs font-bold text-white tracking-wide">Cookie & Telemetry Choices</p>
                </div>
              </div>

              {hasGpc ? (
                <AuroraMaxTruthBadge state="confirmed" className="text-[10px]">
                  GPC Active
                </AuroraMaxTruthBadge>
              ) : (
                <AuroraMaxTruthBadge state="live" className="text-[10px]">
                  Action Needed
                </AuroraMaxTruthBadge>
              )}
            </div>

            <p className="text-xs leading-relaxed text-white/60">
              We use essential cookies to maintain your login session and CSRF security. With your consent,
              we use anonymous performance telemetry (PostHog & Sentry) to measure speed and prevent crashes.
              We never sell your data or use advertising cookies.
            </p>

            {hasGpc && (
              <div className="flex items-center gap-2 rounded-lg border border-vouch-cyan/20 bg-vouch-cyan/5 px-3 py-2 text-[11px] text-white/80">
                <Sparkles className="h-3.5 w-3.5 shrink-0" style={{ color: AURORA_CYAN_HEX }} />
                <span>Global Privacy Control detected: non-essential analytics default to off.</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <AuroraMaxControl
                tone="primary"
                onClick={handleAcceptAll}
                className="flex-1 sm:flex-initial text-xs py-2 px-3.5 justify-center font-semibold"
              >
                Accept all
              </AuroraMaxControl>
              <AuroraMaxControl
                tone="neutral"
                onClick={handleRejectAll}
                className="flex-1 sm:flex-initial text-xs py-2 px-3.5 justify-center"
              >
                Reject non-essential
              </AuroraMaxControl>
              <button
                type="button"
                onClick={() => setShowDetailed(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-white/50 hover:text-white transition-colors ml-auto"
              >
                <Sliders className="h-3 w-3" />
                Customize
              </button>
            </div>

            <div className="text-[11px] text-white/40 flex items-center gap-1 pt-0.5">
              <span>Read our</span>
              <a
                href="/privacy"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-white/80 transition-colors inline-flex items-center gap-0.5"
              >
                Privacy Policy
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveDetailed} className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <AuroraMaxEyebrow className="text-[10px]">PREFERENCES</AuroraMaxEyebrow>
                <h3 className="text-xs font-bold text-white tracking-wide">Customize Consent</h3>
              </div>
              <AuroraMaxTruthBadge state="projected" className="text-[10px]">
                Granular
              </AuroraMaxTruthBadge>
            </div>

            <div className="space-y-2 max-h-[48vh] overflow-y-auto pr-1">
              {/* Essential */}
              <div className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white">Strictly Necessary</span>
                    <span className="text-[10px] font-mono text-[#a8d8b6]/80 bg-[#0d2318] px-1.5 py-0.2 rounded border border-[#a8d8b6]/30">
                      Required
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    Authentication tokens, CSRF protection, and platform stability. Cannot be disabled.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked
                  disabled
                  aria-label="Strictly necessary cookies"
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-vouch-cyan focus:ring-0 opacity-60 cursor-not-allowed"
                />
              </div>

              {/* Functional */}
              <label className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-2.5 hover:border-white/20 transition-colors cursor-pointer">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-xs font-semibold text-white">Functional Preferences</span>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    Preserves UI states, theme preferences, and draft research slips across sessions.
                  </p>
                </div>
                <input
                  type="checkbox"
                  name="functional"
                  defaultChecked={true}
                  aria-label="Functional preference cookies"
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-black/40 text-vouch-cyan focus:ring-vouch-cyan/50"
                />
              </label>

              {/* Analytics */}
              <label className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-2.5 hover:border-white/20 transition-colors cursor-pointer">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-xs font-semibold text-white">Analytics & Performance</span>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    Anonymized usage metrics (PostHog) and performance monitoring to diagnose errors and load times.
                  </p>
                </div>
                <input
                  type="checkbox"
                  name="analytics"
                  defaultChecked={!hasGpc}
                  aria-label="Analytics cookies"
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-black/40 text-vouch-cyan focus:ring-vouch-cyan/50"
                />
              </label>

              {/* Marketing */}
              <div className="flex items-start justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.01] p-2.5 opacity-50">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white">Marketing & Advertising</span>
                    <span className="text-[10px] font-mono text-white/40">Not Used</span>
                  </div>
                  <p className="text-[11px] text-white/40 leading-relaxed">
                    VouchEdge does not deploy advertising trackers or share profiles with ad networks.
                  </p>
                </div>
                <input
                  type="checkbox"
                  disabled
                  checked={false}
                  aria-label="Marketing cookies"
                  className="mt-1 h-4 w-4 rounded border-white/10 bg-white/5 opacity-40 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowDetailed(false)}
                className="px-3 py-1.5 text-xs text-white/60 hover:text-white transition-colors"
              >
                Back
              </button>
              <AuroraMaxControl tone="primary" type="submit" className="text-xs py-1.5 px-4 font-semibold">
                Save preferences
              </AuroraMaxControl>
            </div>
          </form>
        )}
      </AuroraMaxPanel>
    </aside>
  );
}
