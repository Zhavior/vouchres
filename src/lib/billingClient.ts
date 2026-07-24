/** Typed wrappers for the billing API. */
import { apiClient } from "./apiClient";

type CheckoutTier = 'gold' | 'seller_pro';

interface CheckoutResponse {
  url: string;
  sessionId?: string;
}

interface PortalResponse {
  url: string;
}

interface BillingStatus {
  tier: 'free' | 'gold' | 'seller_pro';
  status: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

/** Redirect to the single $7.99/month Beta checkout. */
export async function startStripeCheckout(tier: CheckoutTier): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
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

/** Map billing API tier strings to app subscriptionTier values. */
export function tierToSubscriptionTier(tier: BillingStatus['tier']): 'BASIC' | 'GOLD' | 'SELLER_PRO' {
  if (tier === 'gold') return 'GOLD';
  if (tier === 'seller_pro') return 'SELLER_PRO';
  return 'BASIC';
}
