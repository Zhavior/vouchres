import type { CanonicalTier } from "../services/billing/tierConfig";

/**
 * Free open beta — single server-side switch for "everything unlocked, nobody pays".
 *
 * While the beta is active:
 *   - every authenticated account resolves to BETA_ACCESS_TIER, so `requireTier`
 *     gates pass and `requireTierOrQuota` treats the caller as a paid subscriber
 *   - Stripe checkout / customer portal / webhook processing are turned off
 *
 * Quotas are NOT removed. Paid-tier daily ceilings still apply because they are
 * cost protection on metered upstream APIs (Gemini, odds providers), not a
 * feature gate. Everyone simply gets the paid ceiling instead of the free one.
 *
 * Flip back to paid at the end of the beta with:
 *   FREE_BETA_ALL_ACCESS=false
 * (PAYMENTS_ENABLED then defaults back to true; Stripe keys are still required.)
 */

function readFlag(name: string): boolean | null {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return null;
  if (raw === "true" || raw === "1" || raw === "yes" || raw === "on") return true;
  if (raw === "false" || raw === "0" || raw === "no" || raw === "off") return false;
  return null;
}

/** Tier every account is granted while the free beta runs. */
export const BETA_ACCESS_TIER: CanonicalTier = "creator";

/** True while the free open beta grants full access to every account. */
export function isFreeBetaActive(): boolean {
  return readFlag("FREE_BETA_ALL_ACCESS") ?? true;
}

/** True when Stripe checkout, the customer portal, and webhooks should run. */
export function arePaymentsEnabled(): boolean {
  return readFlag("PAYMENTS_ENABLED") ?? !isFreeBetaActive();
}

/** Optional ISO date the beta is advertised to end on (copy only, not enforced). */
export function getFreeBetaEndsAt(): string | null {
  return process.env.FREE_BETA_ENDS_AT?.trim() || null;
}

/**
 * The tier a request should be evaluated against. During the free beta this is
 * always BETA_ACCESS_TIER regardless of what is stored on the profile, so the
 * grant is applied identically by every gate and by the entitlements payload.
 */
export function resolveEffectiveTier(storedTier: unknown): unknown {
  return isFreeBetaActive() ? BETA_ACCESS_TIER : storedTier;
}
