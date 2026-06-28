/** Typed wrappers for the billing API (Stripe test mode). */

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

/** Redirect to Stripe Checkout for the given tier (test mode). */
export async function startStripeCheckout(tier: CheckoutTier): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body?.error || `Server error ${res.status}` };
    }
    const data: CheckoutResponse = await res.json();
    if (!data.url) return { ok: false, error: 'No checkout URL returned' };
    return { ok: true, url: data.url };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Network error' };
  }
}

/** Open the Stripe Customer Portal (manage subscription, cancel, update payment). */
export async function openBillingPortal(): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/billing/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body?.error || `Server error ${res.status}` };
    }
    const data: PortalResponse = await res.json();
    if (!data.url) return { ok: false, error: 'No portal URL returned' };
    return { ok: true, url: data.url };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Network error' };
  }
}

/** Check current billing status from the server (authoritative, not from localStorage). */
export async function fetchBillingStatus(): Promise<BillingStatus | null> {
  try {
    const res = await fetch('/api/billing/status');
    if (!res.ok) return null;
    return await res.json() as BillingStatus;
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
