/**
 * Free open beta — client mirror of server/lib/betaAccess.ts.
 *
 * While the beta is active every account is treated as fully entitled and no
 * payment UI is offered. The server enforces the same grant independently, so
 * this file only controls what the UI shows — it is not a security boundary.
 *
 * Flip back to paid at the end of the beta by setting, in the frontend env:
 *   VITE_FREE_BETA_ALL_ACCESS=false
 * and on the server:
 *   FREE_BETA_ALL_ACCESS=false
 */

function readFlag(raw: unknown): boolean | null {
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (!value) return null;
  if (value === 'true' || value === '1' || value === 'yes' || value === 'on') return true;
  if (value === 'false' || value === '0' || value === 'no' || value === 'off') return false;
  return null;
}

/** True while every feature is unlocked for every account, free of charge. */
export const FREE_BETA_ALL_ACCESS =
  readFlag(import.meta.env.VITE_FREE_BETA_ALL_ACCESS) ?? true;

/** True when checkout / billing portal UI should be offered at all. */
export const PAYMENTS_ENABLED =
  readFlag(import.meta.env.VITE_PAYMENTS_ENABLED) ?? !FREE_BETA_ALL_ACCESS;

/** Optional end date for beta copy, e.g. "2026-10-07". Display only. */
export const FREE_BETA_ENDS_AT =
  (import.meta.env.VITE_FREE_BETA_ENDS_AT as string | undefined)?.trim() || null;

/**
 * Ad slots. Off until real ad inventory exists — deliberately NOT tied to the
 * beta flag, so ending the beta does not switch ads on by itself. The current
 * AdBanner markup labels itself "SPONSORED AD" and ships a placeholder sponsor
 * name and a dead link, so it must not render before real inventory is wired up.
 * Turn on with VITE_ADS_ENABLED=true once ads are actually sold and configured.
 */
export const ADS_ENABLED = readFlag(import.meta.env.VITE_ADS_ENABLED) ?? false;

export const FREE_BETA_HEADLINE = 'Free open beta';

export const FREE_BETA_BLURB = FREE_BETA_ENDS_AT
  ? `Every feature is unlocked for every account through ${formatBetaEndDate(FREE_BETA_ENDS_AT)}. No card, no subscription, nothing to cancel.`
  : 'Every feature is unlocked for every account during the beta. No card, no subscription, nothing to cancel.';

function formatBetaEndDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}
