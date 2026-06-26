# ProfilePage.tsx patch

## Problem

`src/components/ProfilePage.tsx` lines 262-271 contain hardcoded follower
and subscriber counts that change based on the user's `subscriptionTier`:

```tsx
// BEFORE — fabricated follower counts
const followerCount = userProfile.subscriptionTier === 'SELLER_PRO' ? '241' : '38';
const subscriberCount = userProfile.subscriptionTier === 'SELLER_PRO' ? '156' : '15';
```

This is fake social proof — the numbers are made up to make paying users
look more popular. On a betting-picks product, this is fraud-adjacent.

## Fix

Replace the hardcoded counts with a fetch to `/api/profile/:id/stats`,
which returns real counts from the `follows` table.

### Apply this diff

```diff
@@ // src/components/ProfilePage.tsx (around line 260)
- const followerCount = userProfile.subscriptionTier === 'SELLER_PRO' ? '241' : '38';
- const subscriberCount = userProfile.subscriptionTier === 'SELLER_PRO' ? '156' : '15';
+ const [profileStats, setProfileStats] = useState<{ followers: number; following: number; subscribers: number; posts: number } | null>(null);
+
+ useEffect(() => {
+   if (!userProfile?.id) return;
+   let cancelled = false;
+   apiClient
+     .get(`/api/profile/${userProfile.id}/stats`)
+     .then((stats) => { if (!cancelled) setProfileStats(stats); })
+     .catch(() => { if (!cancelled) setProfileStats({ followers: 0, following: 0, subscribers: 0, posts: 0 }); });
+   return () => { cancelled = true; };
+ }, [userProfile?.id]);
+
+ const followerCount = profileStats?.followers ?? 0;
+ const subscriberCount = profileStats?.subscribers ?? 0;
```

### Backend endpoint to add

Add to `server/routes/coreRoutes.ts`:

```ts
coreRoutes.get("/profile/:id/stats", async (req, res) => {
  const { id } = req.params;
  const { supabaseAdmin } = await import("../middleware/auth");

  const [followers, following, posts] = await Promise.all([
    supabaseAdmin.from("follows").select("*", { count: "exact", head: true }).eq("following_profile_id", id),
    supabaseAdmin.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", id),
    supabaseAdmin.from("posts").select("*", { count: "exact", head: true }).eq("author_id", id),
  ]);

  return res.json({
    followers: followers.count ?? 0,
    following: following.count ?? 0,
    subscribers: 0, // implement when paid capper subscriptions exist
    posts: posts.count ?? 0,
  });
});
```

### Also remove

- Any "Verified Seller" badge that appears only when `subscriptionTier === 'SELLER_PRO'`
  unless you've actually issued verification. If you have a real verification
  process, gate it on a new `is_verified_seller` boolean column added to
  `profiles`, not on tier.
- Any "Pro Trader" / "Elite Capper" / similar vanity labels that are
  auto-granted based on tier — replace with the real `tier` value displayed
  as plain text ("Free", "Gold", "Seller PRO").
