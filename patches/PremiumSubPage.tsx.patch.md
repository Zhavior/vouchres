# PremiumSubPage.tsx patch

## Problem

`src/components/PremiumSubPage.tsx` is the most dishonest page in the app:

1. **Line 386** — explicit "Subscriptions are simulated for direct beta
   evaluation" notice. Admits the whole page is theater.
2. **Line 60-79** — `handleActivate(tier)` calls
   `onUpdateProfile({ subscriptionTier: tier, verified: true })` and shows
   `alert('🎉 Successfully activated...')`. No payment is taken.
3. **Lines 43-58** — "Beta signup" generates a `VE-BETA-${Math.floor(1000
   + Math.random() * 9000)}` ID client-side and stores it in localStorage.
   No server record.
4. **Lines 344-358** — SELLER_PRO plan advertises "Open Paid Storefront:
   Get tipped & paid" and "0% commission on storefront sales" — features
   that don't exist and would create legal exposure if they did.

## Fix

Strip everything fake. Replace with real Stripe Checkout.

### Full replacement strategy

Rewrite `PremiumSubPage.tsx` to:

1. Fetch the user's current tier from `/api/billing/status`
2. For each plan, render a "Subscribe" button that calls
   `POST /api/billing/checkout { tier: 'gold' }` and redirects to the
   returned `url`
3. If the user is already on a paid tier, show "Manage subscription"
   button that opens the Stripe Billing Portal
4. Remove the simulated activation alert
5. Remove the SELLER_PRO "storefront" features from the marketing copy
   until they're actually built and legally reviewed

### Pseudocode for the new page

```tsx
export function PremiumSubPage() {
  const { user, refresh } = useAuth();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    apiClient.get<BillingStatus>('/api/billing/status')
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubscribe(tier: 'gold' | 'seller_pro') {
    setRedirecting(true);
    try {
      const { url } = await apiClient.post<{ url: string }>('/api/billing/checkout', { tier });
      window.location.href = url; // Stripe Checkout
    } catch (err) {
      setRedirecting(false);
      console.error('[premium] checkout failed', err);
    }
  }

  async function handleManage() {
    setRedirecting(true);
    try {
      const { url } = await apiClient.post<{ url: string }>('/api/billing/portal');
      window.location.href = url; // Stripe Billing Portal
    } catch (err) {
      setRedirecting(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="premium-page">
      <h1>Upgrade your VouchEdge plan</h1>

      <div className="plan-cards">
        <PlanCard
          name="Free"
          price="$0"
          features={[
            'Daily MLB intelligence report',
            '3 picks per day',
            '10 AI pick explanations per day',
            'Public feed access',
            'Parlay builder (save up to 2)',
          ]}
          current={user?.tier === 'free'}
        />

        <PlanCard
          name="Gold"
          price="$8/mo"
          features={[
            'Everything in Free',
            'Unlimited picks',
            'Unlimited AI explanations',
            'Advanced stats & charts',
            'Save unlimited parlays',
            'Priority data refresh',
          ]}
          current={user?.tier === 'gold'}
          cta={
            user?.tier === 'free'
              ? <button onClick={() => handleSubscribe('gold')} disabled={redirecting}>
                  {redirecting ? 'Redirecting…' : 'Subscribe with Stripe'}
                </button>
              : undefined
          }
        />

        <PlanCard
          name="Seller PRO"
          price="$40/mo"
          features={[
            'Everything in Gold',
            'Verified Seller badge (after manual review)',
            'Custom profile theme',
            'Priority support',
            // REMOVED: "Open Paid Storefront" — not implemented, legal risk
            // REMOVED: "0% commission on sales" — no sales platform exists
            // REMOVED: "Cryptographic API verification keys" — never built
          ]}
          current={user?.tier === 'seller_pro'}
          cta={
            user?.tier === 'free' || user?.tier === 'gold'
              ? <button onClick={() => handleSubscribe('seller_pro')} disabled={redirecting}>
                  {redirecting ? 'Redirecting…' : 'Subscribe with Stripe'}
                </button>
              : undefined
          }
        />
      </div>

      {user && user.tier !== 'free' && (
        <button onClick={handleManage} className="manage-subscription">
          Manage your subscription (cancel / update payment / view invoices)
        </button>
      )}

      <p className="premium-disclaimer">
        Subscriptions are billed monthly via Stripe. Cancel anytime.
        Predictions are for entertainment and research only — not betting advice.
      </p>
    </div>
  );
}
```

### Also remove

- The fake beta signup form at the top of the page — replace with a
  link to `/beta/waitlist` (which hits the real `POST /api/beta/signup`
  endpoint).
- The `VE-BETA-XXXX` localStorage ID.
- All `onUpdateProfile({ subscriptionTier: ... })` calls — tier is read-only
  from the client's perspective.
