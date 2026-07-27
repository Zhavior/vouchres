/** Typed wrappers for the billing API. */
import { apiClient } from "./apiClient";
import type { BillingTier } from "./subscriptionTier";

export { tierToSubscriptionTier } from "./subscriptionTier";

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
}

/** Redirect to the single $7.99/month Beta checkout. */
export async function startStripeCheckout(): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
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
  try {
    return await apiClient.get<BillingStatus>('/api/billing/status');
  } catch {
    return null;
  }
}
