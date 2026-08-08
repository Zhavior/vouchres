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

/** Tier every account is granted while the free beta runs. */
export const BETA_ACCESS_TIER: CanonicalTier = "creator";

const TRUE_TOKENS = ["true", "1", "yes", "on"] as const;
const FALSE_TOKENS = ["false", "0", "no", "off"] as const;

/**
 * Env flags that decide whether every account is handed BETA_ACCESS_TIER.
 * Validated at boot by validateProductionEnvAtBoot so a typo can never be
 * mistaken for "unset".
 */
export const ENTITLEMENT_FLAG_NAMES = ["FREE_BETA_ALL_ACCESS", "PAYMENTS_ENABLED"] as const;

export class InvalidEntitlementFlagError extends Error {
  readonly flag: string;

  constructor(flag: string, rawValue: string) {
    super(
      `${flag} is set to ${JSON.stringify(rawValue)}, which is not a boolean. ` +
        `Use one of ${TRUE_TOKENS.join("/")} or ${FALSE_TOKENS.join("/")}. ` +
        "Refusing to guess: treating an unreadable entitlement flag as unset would " +
        `silently grant every authenticated account ${BETA_ACCESS_TIER} access.`,
    );
    this.name = "InvalidEntitlementFlagError";
    this.flag = flag;
  }
}

/**
 * Absent/blank -> null (caller applies its default). A value we recognise ->
 * that boolean. Anything else throws: an entitlement switch that cannot be read
 * is a configuration error, never a silent grant.
 */
function readFlag(name: string): boolean | null {
  const raw = process.env[name]?.trim();
  if (!raw) return null;
  const normalized = raw.toLowerCase();
  if ((TRUE_TOKENS as readonly string[]).includes(normalized)) return true;
  if ((FALSE_TOKENS as readonly string[]).includes(normalized)) return false;
  throw new InvalidEntitlementFlagError(name, raw);
}

/**
 * Boot-time check — one message per entitlement flag that cannot be parsed.
 * Empty array means every flag is either unset or unambiguously boolean.
 */
export function collectEntitlementFlagErrors(): string[] {
  const errors: string[] = [];
  for (const name of ENTITLEMENT_FLAG_NAMES) {
    try {
      readFlag(name);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  return errors;
}

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
