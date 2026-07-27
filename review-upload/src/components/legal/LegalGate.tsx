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

export function LegalGate() {
  const { user, refresh } = useAuth();
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [jurisdiction, setJurisdiction] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const isLegal = BETTING_LEGAL_STATES.has(jurisdiction);

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
    <div className="legal-gate">
      <div className="legal-gate__card">
        <h2>Before you continue</h2>
        <p>
          VouchEdge provides probability-based sports research for entertainment
          purposes. To use this app, you must confirm:
        </p>

        <form onSubmit={handleSubmit}>
          <label className="legal-gate__checkbox">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
            />
            <span>
              I confirm that I am <strong>at least the legal age in my jurisdiction</strong> (e.g. 18/19+ in most of Canada, 21+ in most regulated US states).
            </span>
          </label>

          <label className="legal-gate__select">
            <span>State / Country of residence</span>
            <select
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              required
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
            <div className="legal-gate__warning">
              Sports betting is not legal in your jurisdiction. You may browse
              public content but cannot post or track picks.
            </div>
          )}

          <div className="legal-gate__disclaimer">
            <strong>Disclaimer:</strong> Predictions on VouchEdge are
            probability-based research for entertainment only. They are not
            betting advice or guarantees of outcome. You are solely responsible
            for any decisions you make based on this content.
          </div>

          {error && <div className="legal-gate__error">{error}</div>}

          <button type="submit" disabled={submitting || !ageConfirmed || !jurisdiction}>
            {submitting ? "Saving…" : "I understand — continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
