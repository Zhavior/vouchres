/** Typed wrappers for the billing API. */
import { apiClient } from "./apiClient";
import type { BillingTier } from "./subscriptionTier";
import { FREE_BETA_ALL_ACCESS, PAYMENTS_ENABLED } from "./betaAccess";

export { tierToSubscriptionTier } from "./subscriptionTier";

export const PAYMENTS_DISABLED_MESSAGE =
  "VouchEdge is in free open beta — every feature is already unlocked and there is nothing to pay for.";

interface CheckoutResponse {
  url: string;
  sessionId?: string;
}

interface PortalResponse {
  url: string;
}

export interface BillingStatus {
  tier: BillingTier;
  status: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  /** True while the free open beta grants full access to every account. */
  freeBeta?: boolean;
  paymentsEnabled?: boolean;
}

/**
 * Start Stripe checkout. Disabled during the free open beta — callers get a
 * refusal without a network round-trip, and the server refuses independently.
 */
export async function startStripeCheckout(): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!PAYMENTS_ENABLED) {
    return { ok: false, error: PAYMENTS_DISABLED_MESSAGE };
  }

  try {
    const data = await apiClient.post<CheckoutResponse>('/api/billing/checkout', { tier: 'pro', interval: 'monthly' });
    if (!data.url) return { ok: false, error: 'No checkout URL returned' };
    return { ok: true, url: data.url };
  } catch (err: any) {
    return { ok: false, error: err?.message || err?.error || 'Network error' };
  }
}

/** Open the Stripe Customer Portal (manage subscription, cancel, update payment). */
export async function openBillingPortal(): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!PAYMENTS_ENABLED) {
    return { ok: false, error: PAYMENTS_DISABLED_MESSAGE };
  }

  try {
    const data = await apiClient.post<PortalResponse>('/api/billing/portal');
    if (!data.url) return { ok: false, error: 'No portal URL returned' };
    return { ok: true, url: data.url };
  } catch (err: any) {
    return { ok: false, error: err?.message || err?.error || 'Network error' };
  }
}

/** Check current billing status from the server (authoritative, not from localStorage). */
export async function fetchBillingStatus(): Promise<BillingStatus | null> {
  if (FREE_BETA_ALL_ACCESS) {
    // Nothing bills during the beta; report the grant without a round-trip so
    // the account screens never show a "billing unavailable" warning.
    return { tier: 'creator', status: 'free_beta', freeBeta: true, paymentsEnabled: false };
  }

  try {
    return await apiClient.get<BillingStatus>('/api/billing/status');
  } catch {
    return null;
  }
}
