# VouchEdge Beta-Readiness Implementation Spec

**Status:** Ready to execute
**Timeline:** 3 weeks (single dev, full-time)
**Goal:** Ship a defensible freemium beta — real auth, real persistence, real payments, honest UI, no fabricated data.

---

## Executive Summary

The VouchEdge codebase has an excellent server-side intelligence layer (MLB engines, 4-judge panel, trust scoring) but is missing every foundation a freemium product requires: no database, no authentication, no payment integration, and several fabricated-data surfaces that cross into fraud territory for a betting-picks product.

This document specifies the work to ship a credible beta in three weeks. Each week has a clear deliverable that unlocks the next.

**The single most important rule:** every number on the screen must be real by the end of week 3. No fabricated follower counts, no fake leaderboards, no simulated view counts, no self-serve tier upgrades.

---

## Week 1 — Foundation (Persistence + Auth)

**Goal:** Users can create an account, log in, and their data persists across devices and server restarts.

### Day 1: Set up Supabase

1. Create a Supabase project at https://supabase.com/dashboard
2. Install the Supabase CLI: `npm install -g supabase`
3. Link the project: `supabase link --project-ref <your-ref>`
4. Copy `supabase/schema.sql` from this patch kit into `supabase/migrations/0001_init.sql`
5. Push: `supabase db push`
6. Generate TypeScript types: `supabase gen types typescript --project-id <ref> > src/types/db.ts`
7. In Supabase dashboard:
   - Authentication > Providers: enable Email
   - Authentication > Email Templates: customize the confirmation email with VouchEdge branding
   - Authentication > URL Configuration: set Site URL to your frontend URL, Redirect URLs to include `/auth/callback`

### Day 2: Wire backend auth

1. Add dependencies: `npm install @supabase/supabase-js express-rate-limit cors helmet zod cookie-parser`
2. Copy `server/middleware/auth.ts`, `cors.ts`, `rateLimit.ts`, `validation.ts`, `entitlements.ts` from this kit
3. Add `server/middleware/webhookRaw.ts`
4. In `server.ts`, BEFORE `registerApiRoutes(app)`:
   ```ts
   import { corsMiddleware, helmetMiddleware } from "./server/middleware/cors";
   import { globalLimiter } from "./server/middleware/rateLimit";
   app.use(helmetMiddleware);
   app.use(corsMiddleware);
   app.use("/api", globalLimiter);
   // Stripe webhook needs raw body — register BEFORE express.json
   app.post("/api/billing/webhook",
     express.raw({ type: "application/json", limit: "1mb" }),
     billingRoutes
   );
   app.use(express.json());
   ```
5. Add a `/api/auth/me` endpoint that returns the caller's profile (used by `useAuth`):
   ```ts
   router.get("/auth/me", requireAuth, (req, res) => res.json(req.user!.profile));
   ```
6. Migrate the 4 seeded fake picks out of `resultLedgerService.ts` — they're now in `public.cappers` with `is_demo: true`. Replace the in-memory `Map` in `resultLedgerService.ts` with calls to `pickService.ts` from this kit.

### Day 3: Wire frontend auth

1. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env.local`
2. Copy `src/lib/supabaseClient.ts`, `src/lib/apiClient.ts`, `src/lib/useAuth.ts` from this kit
3. Copy `src/components/auth/AuthGate.tsx` and `src/components/legal/LegalGate.tsx`
4. In `App.tsx`, replace the implicit `useState<string>('welcome')` flow with:
   ```tsx
   const { user, loading } = useAuth();
   if (loading) return <LoadingScreen />;
   if (!user) return <AuthGate inviteCodeRequired />;
   if (!user.age_confirmed_at) return <LegalGate />;
   return <MainApp user={user} />;
   ```
5. Remove all `localStorage` reads/writes for `vouchedge_profile`, `vouchedge_posts`, `vouchedge_slips`, etc. These now come from the API.

### Day 4-5: Migrate in-memory state to Postgres

1. Replace `server/services/trust/resultLedgerService.ts` with `pickService.ts` (DB-backed)
2. Replace `server/services/trust/trustScoreService.ts` reads with queries to `public.trust_scores`
3. Replace `server/services/trust/verifiedRecordService.ts` similarly
4. Update `server/routes/resultRoutes.ts` to use the new persistence layer
5. Update `server/routes/trustRoutes.ts` similarly
6. Run `npm run dev` and verify:
   - Sign up → profile row appears in `public.profiles`
   - Sign out → can't access `/api/picks` POST (401)
   - Sign back in → session persists across browser restarts
   - Restart the dev server → user's picks and profile are still there

**Week 1 deliverable:** Users can authenticate, their profile and picks persist in Postgres, and the server survives restarts without losing data.

---

## Week 2 — Monetization (Stripe + Entitlements)

**Goal:** Real money flows. Free tier has hard server-side quotas. Paid tiers unlock via Stripe.

### Day 6: Configure Stripe

1. Create a Stripe account (use TEST MODE for beta)
2. Create two products with monthly recurring prices:
   - "VouchEdge Gold" — $8.00/month
   - "VouchEdge Seller PRO" — $40.00/month
3. Copy the price IDs (look like `price_1ABC...`) into `.env.local` as `STRIPE_PRICE_GOLD` and `STRIPE_PRICE_SELLER_PRO`
4. Create a webhook endpoint pointing to `https://<your-ngrok-or-render-url>/api/billing/webhook`
5. Subscribe to events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
6. Copy the webhook signing secret (`whsec_...`) into `.env.local` as `STRIPE_WEBHOOK_SECRET`
7. Install Stripe CLI locally for testing: `stripe listen --forward-to localhost:3000/api/billing/webhook`

### Day 7: Wire billing backend

1. `npm install stripe`
2. Copy `server/services/billing/stripeService.ts` and `server/routes/billingRoutes.ts` from this kit
3. Register `billingRoutes` in `server/routes/index.ts`
4. Test locally with Stripe CLI:
   - POST `/api/billing/checkout { tier: "gold" }` → returns Stripe Checkout URL
   - Complete checkout with test card `4242 4242 4242 4242`
   - Verify webhook fires → `profiles.tier` updates to `gold`
   - Verify `subscriptions` table has a row with `status: 'active'`

### Day 8: Server-side entitlements

1. Add `daily_quotas` table to your schema (see comment in `server/middleware/entitlements.ts`)
2. Add the `increment_quota` RPC function
3. Apply `requireTier` and `requireTierOrQuota` middleware to your routes:
   ```ts
   // Free tier: 3 picks/day, 10 AI explanations/day
   router.post("/picks", requireAuth, requireLegalConfirmed, pickLimiter,
     requireTierOrQuota("gold", 3, "picks_per_day"), createPickHandler);
   router.post("/ai/explain-pick", requireAuth,
     requireTierOrQuota("gold", 10, "ai_explain"), explainPickHandler);
   router.post("/ai/daily-report", requireAuth,
     requireTierOrQuota("gold", 1, "ai_daily_report"), dailyReportHandler);
   ```
4. Verify: as a free user, post 3 picks → 4th returns 429 with `upgrade_url: "/premium"`
5. Verify: as a gold user, post unlimited picks → succeeds

### Day 9: Rewrite PremiumSubPage

1. Apply the patch in `patches/PremiumSubPage.tsx.patch.md` — full rewrite
2. Apply the patch in `patches/SettingsPage.tsx.tier-toggle.patch.md` — remove self-serve tier toggle
3. Verify the upgrade flow end-to-end:
   - Click "Subscribe" on the Gold plan → redirect to Stripe Checkout
   - Complete checkout → redirect back to `/premium?checkout=success`
   - Refresh page → tier shows as "Gold"
   - Go to Settings → see "Manage subscription" button → opens Stripe Billing Portal
   - Cancel subscription in portal → webhook fires → tier reverts to "free"

### Day 10: Beta signup flow

1. Apply `server/services/persistence/betaService.ts` from this kit
2. Add the `/api/beta/signup` and `/api/admin/issue-invite` routes from `coreRoutes.ts`
3. Build a simple `/beta/waitlist` page that collects email and POSTs to `/api/beta/signup`
4. Build a staff-only admin page at `/admin/beta` that lists waitlist emails and an "Issue invite" button per row
5. Configure Supabase Auth > Email Templates > Invite User to send a branded invite email

**Week 2 deliverable:** Real Stripe Checkout, server-enforced quotas, real beta waitlist. A user can pay $8 and actually get unlimited picks. A user can cancel and actually lose access.

---

## Week 3 — Trust, Legal, Cleanup

**Goal:** Every number on screen is real. Legal exposure minimized. Dead code removed.

### Day 11-12: Remove fabricated data

Apply every patch in `patches/`:

| Patch | Effect |
|-------|--------|
| `Leaderboard.tsx.replacement` | Empty leaderboard on day 1 (correct — no graded picks yet) |
| `ProfilePage.tsx.patch.md` | Real follower/post counts from DB |
| `SubscriberHub.tsx.patch.md` | Real cappers from `public.cappers`, DEMO badges |
| `App.tsx.fallbackGames.patch.md` | Honest "live games unavailable" state instead of fake fallback |
| `mockData-and-FeedPostCard.patch.md` | Demo banner on seed posts, real view counts |
| `SettingsPage.tsx.tier-toggle.patch.md` | Tier read-only, manage via Stripe Portal |
| `PremiumSubPage.tsx.patch.md` | Real Stripe Checkout, no fake activation |

Run the app as a brand-new user. Every number you see must trace back to a real DB query. If you see a number you can't explain, find the source.

### Day 13: Legal gates

1. Apply `src/components/legal/LegalGate.tsx` from this kit
2. Add `/api/legal/confirm` endpoint (in `coreRoutes.ts`)
3. Apply `requireLegalConfirmed` middleware to every pick-creating route
4. Update the blocked-jurisdictions list in `server/middleware/auth.ts` based on legal counsel review
5. Add prominent disclaimers to:
   - Home feed header
   - Every pick card
   - The ParlayLab
   - The Results page
   - Email footers
6. Add a Terms of Service page (use a template from Termly or TermsFeed, then have counsel review)
7. Add a Privacy Policy page (Supabase auth requires this)

### Day 14: Grading job + cleanup

1. Build a daily grading cron job that:
   - Queries `picks` where `status = 'pending'` and `event_id` is in yesterday's slate
   - Fetches results from `statsapi.mlb.com/api/v1/game/<pk>/boxscore`
   - Grades each pick via the `resultGrader.ts` logic
   - Calls `pickService.gradePick()` for each
2. Run the cleanup script: `bash cleanup.sh`
3. Manually delete the dead `VOUCHEDGE COMPAT MLB ROUTES` block in `server.ts` (lines ~757-1152)
4. Update `package.json` name from `react-example` to `vouchedge`
5. Update `index.html` title from "My Google AI Studio App" to "VouchEdge — MLB Picks & Intelligence"
6. Update `README.md` to remove the AI Studio banner — write a real README
7. Run `npm run lint` and fix any type errors
8. Deploy to Render (paid tier)
9. Run smoke tests:
   - Sign up fresh
   - Confirm legal
   - Post a pick
   - Subscribe to Gold
   - View profile (real counts)
   - View leaderboard (empty, correct)
   - Sign out, sign back in — state persists

**Week 3 deliverable:** Every visible number is real. Legal gates in place. Dead code removed. Ready for invite-only beta.

---

## Out of Scope for Beta (Cut from Current Build)

These features exist in the current codebase but should NOT ship in the beta. Hide them behind feature flags or remove the navigation entries:

| Feature | Reason |
|---------|--------|
| `VouchStudioDarkroom.tsx` (1,962 lines) | Scope bloat. Ship after beta. |
| `LiveStreams.tsx` (1,612 lines) | No streaming infra. Remove nav entry. |
| `AisLandingPage.tsx` (1,583 lines) | AI Studio splash. Delete. |
| `PokemonPlayerCard.tsx` | Novelty. Ship after beta. |
| `ThemeStore.tsx` | Cosmetic. Ship after beta. |
| AI image generation (`/api/ai/generate-image`) | Cost center. Ship only to paid tiers post-beta. |
| AI theme generation (`/api/ai/generate-theme`) | Same. |
| "Paid Storefront" / "0% commission" features | Legal landmine. Do not ship without counsel. |
| Vouch Board, Vouch Scan, Vouch Circle | Core vouch mechanic is fine, but the elaborate UIs around it can wait. |

**Keep for beta:** TodayDashboard, ParlayLab, ResultsPage, ProfilePage, HomeFeed, MlbIntelligenceHub, Leaderboard (now empty/honest), PremiumSubPage (now real Stripe), Settings, AuthGate, LegalGate.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Gemini API bill from unauthenticated abuse | High | $$$ | Rate limiters (this kit) + daily quotas per user |
| User data loss on server restart | Eliminated | — | Postgres persistence (this kit) |
| Stripe webhook fails to sync tier | Medium | User pays but doesn't get upgraded | Add Sentry alert on webhook errors; manual tier-override admin page |
| User in illegal-jurisdiction state posts picks | Medium | Legal | Geofence + age gate + blocked-jurisdiction list (this kit); get counsel review |
| Fabricated data still surfaces somewhere | Medium | Reputational | Day 12 audit pass — grep for hardcoded numbers in components |
| Free user exceeds quota via race condition | Low | Minor | Acceptable for beta; the `increment_quota` RPC is best-effort |
| Stripe key leaks | Low | Severe | Keys in env vars only; rotate on any suspected leak; use test mode for beta |
| Supabase auth outage | Low | High | Status page at https://status.supabase.com; no mitigation, just monitoring |

---

## Post-Beta Roadmap (After Beta Stabilizes)

1. **Real-time updates** — Supabase Realtime for live pick grading (instead of polling)
2. **Sentry + PostHog** — error tracking + product analytics
3. **Migration to Upstash Redis** — for multi-instance rate limiting
4. **Following feed** — replace demo-seeded feed with real follows graph
5. **Capper storefronts** — only after legal review of tout-service regulations
6. **Mobile app** — React Native (Capacitor also viable)
7. **Backtesting** — replay historical slates through the judge panel
8. **Multi-sport** — extend `sport` field beyond MLB

---

## Definition of Done — Beta

A user can:

- [x] Join the waitlist at `/beta/waitlist` (real email captured server-side)
- [x] Receive an invite email with a code
- [x] Sign up with email + password + invite code
- [x] Confirm 21+ age and jurisdiction
- [x] Browse the home feed (real posts from real cappers + clearly-labeled demo content)
- [x] View the leaderboard (empty on day 1, populates as picks grade)
- [x] See real capper profiles with real stats
- [x] Post up to 3 picks per day (free tier, server-enforced)
- [x] Get up to 10 AI explanations per day (free tier, server-enforced)
- [x] Upgrade to Gold via Stripe Checkout — unlimited picks, unlimited AI
- [x] Manage their subscription (cancel, update payment) via Stripe Billing Portal
- [x] View their own profile with real follower/pick/unit counts
- [x] Sign out and back in — state persists across devices
- [x] See honest disclaimers on every prediction surface
- [x] NOT see any fabricated numbers anywhere in the UI

If you can check every box, ship the beta. If you can't, don't.
