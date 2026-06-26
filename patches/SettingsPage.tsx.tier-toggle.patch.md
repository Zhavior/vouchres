# SettingsPage.tsx tier-toggle patch

## Problem

`src/components/SettingsPage.tsx` lines 820-858 contain a self-serve
subscription tier toggle. Any user can click a button to instantly
upgrade themselves from `BASIC` to `GOLD` or `SELLER_PRO`. This bypasses
payment entirely.

```tsx
// BEFORE — anyone can self-upgrade
const handleTierChange = (newTier: SubscriptionTier) => {
  onUpdateProfile({ subscriptionTier: newTier, verified: true });
  // ...
};
```

## Fix

Remove the tier toggle entirely. Display the user's current tier as
read-only text. Provide a "Manage subscription" button that links to
the Stripe Billing Portal (or an "Upgrade" button that links to the
Premium page, which now launches real Stripe Checkout).

### Apply this diff

```diff
@@ // src/components/SettingsPage.tsx (around line 820)
- {/* Tier toggle */}
- <div className="settings__tier-toggle">
-   <h3>Subscription Tier</h3>
-   <div className="tier-buttons">
-     <button
-       onClick={() => handleTierChange('BASIC')}
-       className={userProfile.subscriptionTier === 'BASIC' ? 'active' : ''}
-     >Basic (Free)</button>
-     <button
-       onClick={() => handleTierChange('GOLD')}
-       className={userProfile.subscriptionTier === 'GOLD' ? 'active' : ''}
-     >Gold ($8/mo)</button>
-     <button
-       onClick={() => handleTierChange('SELLER_PRO')}
-       className={userProfile.subscriptionTier === 'SELLER_PRO' ? 'active' : ''}
-     >Seller PRO ($40/mo)</button>
-   </div>
- </div>
+ {/* Tier — read-only. Upgrades via Stripe Checkout at /premium. */}
+ <div className="settings__tier-display">
+   <h3>Subscription Tier</h3>
+   <p>
+     Current plan: <strong>{tierLabel(userProfile.tier)}</strong>
+     {userProfile.tier === 'free' && (
+       <a href="/premium" className="settings__upgrade-link">
+         Upgrade plan →
+       </a>
+     )}
+     {userProfile.tier !== 'free' && (
+       <button
+         onClick={async () => {
+           const { data } = await apiClient.post<{ url: string }>('/api/billing/portal');
+           window.location.href = data.url;
+         }}
+         className="settings__manage-subscription"
+       >
+         Manage subscription (cancel / update payment)
+       </button>
+     )}
+   </p>
+ </div>
```

### Helper

```tsx
function tierLabel(tier: string): string {
  switch (tier) {
    case 'free':       return 'Free';
    case 'gold':       return 'Gold ($8/mo)';
    case 'seller_pro': return 'Seller PRO ($40/mo)';
    default:           return tier;
  }
}
```

### Also remove

- Any other place in the codebase that calls
  `onUpdateProfile({ subscriptionTier: ... })` — only the Stripe webhook
  should change the tier. Search for `subscriptionTier:` and audit every
  call site.
- The `verified: true` flag being set when tier changes. Verification is a
  separate concept from paid tier — verify separately, manually, by staff.
