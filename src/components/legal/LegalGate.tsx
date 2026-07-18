import { useState } from "react";
import { useAuth } from "../../lib/useAuth";

/**
 * LegalGate — shown after signup, before any pick-related action.
 * User must confirm they meet the legal age in their jurisdiction and
 * select that jurisdiction (age of majority for gambling/research varies
 * by state/province — e.g. 18/19 in most of Canada, 21 in most US states
 * with regulated sports betting — so we don't hardcode a single number).
 *
 * This is a client-side UX layer. The server enforces via
 * requireLegalConfirmed middleware — a user who somehow skips this UI
 * still cannot POST /api/picks.
 */
const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY",
];

// Sports betting currently legal in these US states (as of 2025).
// Update as law changes. This list is non-exhaustive — consult counsel.
const BETTING_LEGAL_STATES = new Set([
  "AZ","AR","CO","CT","DE","DC","IL","IN","IA","KS","KY","LA","ME","MD","MA",
  "MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OR",
  "PA","RI","SD","TN","VT","VA","WA","WV","WY",
]);

function jurisdictionLooksPermitted(code: string): boolean {
  if (!code) return false;
  if (code.startsWith("CA-")) return true;
  if (code.startsWith("US-")) return BETTING_LEGAL_STATES.has(code.slice(3));
  return BETTING_LEGAL_STATES.has(code);
}

export function LegalGate() {
  const { user, refresh } = useAuth();
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [jurisdiction, setJurisdiction] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const isLegal = jurisdictionLooksPermitted(jurisdiction);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!ageConfirmed) {
      setError("You must confirm you meet the legal age in your jurisdiction.");
      return;
    }
    if (!jurisdiction) {
      setError("Please select your state or country.");
      return;
    }

    setSubmitting(true);
    try {
      const { apiClient } = await import("../../lib/apiClient");
      await apiClient.post("/api/legal/confirm", {
        age_confirmed: true,
        jurisdiction,
      });
      await refresh();
    } catch (err: any) {
      setError(err?.message ?? "Failed to save confirmation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="legal-gate fixed inset-0 z-[120] flex items-end justify-center bg-black/80 p-3 backdrop-blur-sm sm:items-center">
      <div
        className="legal-gate__card max-h-[min(92vh,720px)] w-full max-w-md overflow-y-auto rounded-2xl border border-white/15 bg-[#0b0f19] p-5 text-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-gate-title"
      >
        <h2 id="legal-gate-title" className="text-xl font-black tracking-tight">Before you continue</h2>
        <p className="mt-2 text-sm text-white/65">
          VouchEdge provides probability-based sports research for entertainment
          purposes. To use this app, you must confirm:
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="legal-gate__checkbox flex items-start gap-3 text-sm text-white/80">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-emerald-400"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
            />
            <span>
              I confirm that I am <strong>at least the legal age in my jurisdiction</strong> (e.g. 18/19+ in most of Canada, 21+ in most regulated US states).
            </span>
          </label>

          <label className="legal-gate__select flex flex-col gap-1.5 text-sm">
            <span className="text-white/70">State / Country of residence</span>
            <select
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              required
              className="rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-white"
            >
              <option value="">Select…</option>
              <optgroup label="United States">
                {US_STATES.map((s) => (
                  <option key={s} value={`US-${s}`}>
                    {s} {BETTING_LEGAL_STATES.has(s) ? "✓" : "✗ (not available)"}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Outside the US">
                <option value="CA-ON">Canada — Ontario</option>
                <option value="OTHER">Other (not available)</option>
              </optgroup>
            </select>
          </label>

          {jurisdiction && !isLegal && (
            <div className="legal-gate__warning rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
              Sports betting is not legal in your jurisdiction. You may browse
              public content but cannot post or track picks.
            </div>
          )}

          <div className="legal-gate__disclaimer rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-white/55">
            <strong className="text-white/80">Disclaimer:</strong> Predictions on VouchEdge are
            probability-based research for entertainment only. They are not
            betting advice or guarantees of outcome. You are solely responsible
            for any decisions you make based on this content.
          </div>

          {error && <div className="legal-gate__error text-sm text-red-300">{error}</div>}

          <button
            type="submit"
            disabled={submitting || !ageConfirmed || !jurisdiction}
            className="ve-touch-target w-full rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Saving…" : "I understand — continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
