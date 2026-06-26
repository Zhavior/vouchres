# Patches to remove / label fabricated data

These are the highest-risk changes for beta launch. Fabricated capper
records and follower counts on a betting-picks product cross into fraud
territory. Apply these BEFORE letting any real user sign up.

Each file below contains a full replacement for the named source file.
Apply by copying over your existing version.

| File | What it changes |
|------|-----------------|
| `Leaderboard.tsx.replacement` | Removes `TOP_10_CAPPERS` hardcoded fake capper records. Replaces with a real fetch from `/api/leaderboard`. Shows "No qualified cappers yet" when empty (which is the truth at beta launch). |
| `ProfilePage.tsx.patch.md` | Removes hardcoded follower/subscriber counts (`241`/`38`, `156`/`15`). Pulls real counts from `/api/profile/:id`. Shows `0` instead of fake numbers when no followers. |
| `SubscriberHub.tsx.patch.md` | Removes hardcoded `cappers` array with fake win rates (72.8%, 64.1%) and subscriber counts (1,840, 752). Fetches real cappers from `/api/cappers`. |
| `App.tsx.fallbackGames.patch.md` | Removes the 12-game hardcoded `fallbackGames` array used as a "live" fallback when `/api/mlb/live` fails. Shows an honest "Live games temporarily unavailable" message instead. |
| `mockData.ts.patch.md` | Marks every entry in `INITIAL_POSTS` with `is_demo: true`. Adds a top-of-feed banner: "Demo content — your feed will populate as you follow real cappers and users." |
| `FeedPostCard.tsx.views.patch.md` | Replaces `simulatedViews` (fabricated engagement metric labeled as "Views") with `view_count` from the database. Hides the Views count entirely when no real count is available. |
| `SettingsPage.tsx.tier-toggle.patch.md` | Removes the self-serve subscriptionTier toggle button. Users can no longer upgrade themselves to SELLER_PRO by clicking. Tier is read-only and synced from Stripe. |
| `PremiumSubPage.tsx.patch.md` | Removes the "Subscriptions are simulated" notice. Replaces with real Stripe Checkout button. Removes the alert() success message. Removes the "0% commission on storefront sales" copy (legal risk). |

## Application order

1. Apply all `.tsx.replacement` files (full file replacements)
2. Apply all `.patch.md` files (manual edits — read the patch, apply the diff)
3. Run `npm run lint` and fix any imports
4. Run `npm run dev` and verify the UI looks sane

## What you'll see after applying these patches

- The Leaderboard page will be **empty** on day 1 of beta. That's correct —
  no real cappers have graded picks yet. Add a "Be the first" call-to-action.
- Profile pages will show **0 followers / 0 subscribers** for every new
  user. That's correct. Real numbers will populate as the community grows.
- The Subscriber Hub will show only the **demo cappers** (professor, hr-hunter,
  etc.) with `is_demo: true` flagged. Display a "DEMO" badge on their cards.
- The Premium page will redirect to **Stripe Checkout** instead of
  `alert('🎉 Successfully activated...')`. No fake upgrades.
- The settings page will show the user's current tier as **read-only text**
  with a "Manage subscription" button that links to the Stripe Billing Portal.

This is the honest baseline. From here, every number on the screen is real.
