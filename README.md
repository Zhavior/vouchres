# VouchEdge Beta-Readiness Patch Kit

**Goal:** Transform the VouchEdge AI Studio prototype into a defensible
freemium beta — real auth, real persistence, real payments, honest UI.

**Read first:** [`IMPLEMENTATION.md`](./IMPLEMENTATION.md) — the 3-week
day-by-day plan.

---

## Quickstart (TL;DR)

```bash
# 1. Commit current state so you can revert if anything breaks
git add -A && git commit -m "before beta patches"

# 2. Run cleanup — delete backup file, dedupe assets, fix branding
bash download/vouchedge-beta-patches/cleanup.sh

# 3. Create a Supabase project, then push the schema
npm install -g supabase
supabase login
supabase link --project-ref YOUR_REF
cp download/vouchedge-beta-patches/supabase/schema.sql supabase/migrations/0001_init.sql
supabase db push

# 4. Install new dependencies
npm install @supabase/supabase-js stripe express-rate-limit cors helmet zod cookie-parser
npm install -D @types/cors @types/cookie-parser

# 5. Copy the middleware + routes + services from the patch kit
#    into your project (preserving the same paths).

# 6. Apply the patches in patches/ (read each .patch.md, apply the diff)

# 7. Configure .env.local from .env.example

# 8. Run the dev server and smoke-test
npm run dev
```

See `IMPLEMENTATION.md` for the full 3-week sequencing.

---

## File Index

### Foundation
| File | Purpose |
|------|---------|
| `supabase/schema.sql` | Full Postgres schema — profiles, picks, trust_scores, subscriptions, follows, posts, RLS policies, triggers |
| `.env.example` | All required env vars (Supabase, Stripe, Gemini, CORS, etc.) |
| `render.yaml` | Render deployment config (paid Starter tier — no sleep) |
| `package.json.diff.txt` | New dependencies to add |

### Server middleware
| File | Purpose |
|------|---------|
| `server/middleware/auth.ts` | Supabase JWT verification, `requireAuth`, `optionalAuth`, `requireStaff`, `requireLegalConfirmed` (age + jurisdiction gate) |
| `server/middleware/entitlements.ts` | `requireTier()` (hard tier gate) + `requireTierOrQuota()` (free-tier daily quota) |
| `server/middleware/rateLimit.ts` | Global / AI / pick / beta-signup / webhook rate limiters |
| `server/middleware/cors.ts` | Whitelist-based CORS + Helmet security headers |
| `server/middleware/validation.ts` | Zod schema validation for request body/query/params |
| `server/middleware/webhookRaw.ts` | Raw-body handler for Stripe webhooks |

### Server routes
| File | Purpose |
|------|---------|
| `server/routes/authRoutes.ts` | `/api/auth/me`, `/api/auth/profile` PATCH, `/api/auth/username-check` |
| `server/routes/publicRoutes.ts` | `/api/leaderboard`, `/api/cappers`, `/api/cappers/:id`, `/api/profile/:id`, `/api/profile/:id/stats`, `/api/follow`, `/api/following` |
| `server/routes/postRoutes.ts` | `/api/feed`, `/api/feed/discover`, `/api/posts` CRUD, `/api/posts/:id/like`, `/api/posts/:id/comments`, view counter |
| `server/routes/coreRoutes.ts` | `/api/beta/signup`, `/api/legal/confirm`, `/api/picks` (POST + GET), `/api/admin/grade` |
| `server/routes/billingRoutes.ts` | `/api/billing/checkout`, `/api/billing/portal`, `/api/billing/status`, `/api/billing/webhook` |
| `server/routes/adminRoutes.ts` | Staff-only: beta waitlist mgmt, user mgmt, capper CRUD, manual grading trigger, dashboard stats |
| `server/routes/index.ts.replacement` | Updated route registration (drops in over your existing file) |
| `server.ts.patch.md` | Wire middleware + raw-body webhook into the main server file |

### Server services
| File | Purpose |
|------|---------|
| `server/services/billing/stripeService.ts` | Customer sync, Checkout session creation, Billing Portal, subscription sync to Postgres |
| `server/services/persistence/pickService.ts` | DB-backed pick CRUD — replaces in-memory `resultLedgerService.ts`. Includes trust-score rollup on grade. |
| `server/services/persistence/betaService.ts` | Waitlist signup + invite code issuance + activation tracking |
| `server/services/grading/gradingService.ts` | Resolves pending picks by fetching MLB boxscores. THE ONLY code path that grades picks. |

### Server cron
| File | Purpose |
|------|---------|
| `server/cron/dailyGradeJob.ts` | Nightly cron — grades picks from concluded games. Run via Render Cron or node-cron. |

### Frontend
| File | Purpose |
|------|---------|
| `src/lib/supabaseClient.ts` | Browser Supabase client + auth helpers (signUp, signIn, magic link, signOut) |
| `src/lib/apiClient.ts` | Authenticated fetch wrapper — auto-attaches JWT, handles 401/402/429 |
| `src/lib/useAuth.ts` | `useAuth()` hook (profile loading + auth state subscription) + `useEntitlements()` (UI feature gating) |
| `src/components/auth/AuthGate.tsx` | Login/signup screen with invite-code support for private beta |
| `src/components/legal/LegalGate.tsx` | 21+ age + jurisdiction confirmation gate |
| `src/components/admin/AdminDashboard.tsx` | Staff UI: beta waitlist mgmt, user mgmt, capper CRUD, manual grading, stats |

### Tests
| File | Purpose |
|------|---------|
| `tests/setup.ts` | Test DB reset + helpers (`createTestUser`, `signInTestUser`, `resetTestDb`) |
| `tests/auth.test.ts` | Signup → profile creation → token validation → username check → security (tier-update rejected) |
| `tests/pickLifecycle.test.ts` | Create → grade → trust rollup (with 20-pick sample damp-factor verification) |
| `tests/billing.test.ts` | Stripe sync → tier upgrade → tier downgrade on cancel → signature verification |
| `tests/grading.test.ts` | Mock boxscores → HR/RBI grading → idempotency → dry-run mode → unknown markets |
| `tests/betaSignup.test.ts` | Waitlist join → invite issue → validate code → activation |
| `vitest.config.ts` | Vitest config with V8 coverage |
| `.env.test.example` | Test env vars (separate test Supabase project required) |
| `.github/workflows/test.yml` | CI: type-check + test on every push/PR |

### Legal
| File | Purpose |
|------|---------|
| `legal/TERMS_OF_SERVICE.md` | Termly-style ToS draft with `[REVIEW:]` markers for counsel — eligibility, content standards, billing, liability, arbitration |
| `legal/PRIVACY_POLICY.md` | GDPR/CCPA-compliant privacy policy — data collection, sharing, retention, DSAR workflow, SCC coverage |

### Patches (apply manually)
| File | What it removes/changes |
|------|-------------------------|
| `patches/Leaderboard.tsx.replacement` | Removes fabricated `TOP_10_CAPPERS` with fake 73.7% win rates. Shows honest empty state. |
| `patches/ProfilePage.tsx.patch.md` | Removes hardcoded follower/subscriber counts (241/156/38/15) |
| `patches/SubscriberHub.tsx.patch.md` | Removes fake "Alpha Baseball Guru" with 1,840 fake subscribers |
| `patches/SettingsPage.tsx.tier-toggle.patch.md` | Removes the self-serve SELLER_PRO upgrade button |
| `patches/PremiumSubPage.tsx.patch.md` | Replaces fake activation with real Stripe Checkout |
| `patches/App.tsx.fallbackGames.patch.md` | Removes 12 fake "live" MLB games used as fallback |
| `patches/mockData-and-FeedPostCard.patch.md` | Demo banners + real view counts (replaces `simulatedViews`) |
| `patches/agentRegistry-migration.patch.md` | Migrates capper picks from in-memory to Postgres |
| `patches/frontend-feed-integration.patch.md` | Replaces localStorage feed with real `/api/feed` calls + `feedApi.ts` client |

### Cleanup
| File | Purpose |
|------|---------|
| `cleanup.sh` | Deletes `server_BACKUP_BEFORE_MLB_ROUTES.ts`, dedupes `manifest 2.json` etc., fixes `<title>` and `package.json` name |

---

## What's still on YOUR plate (things I can't do for you)

| Task | Why me? Why not me? |
|------|---------------------|
| Create Supabase project | Requires your account |
| Create Stripe account + products | Requires your identity/banking |
| Apply patches to your source files | Requires your repo state — patches are diffs, not auto-applies |
| Get legal review of ToS + Privacy Policy | The drafts in `legal/` are templates marked with `[REVIEW:]` — counsel must sign off |
| Set up Sentry / PostHog accounts | Requires your accounts |
| Decide the actual price points | $8/mo and $40/mo are placeholders from the existing code |
| Test the full flow end-to-end with real Stripe test cards | Requires your running app |
| Invite the first 10-20 beta users personally | You know your community |
| Set up GitHub Actions secrets for CI | SUPABASE_URL_TEST, SUPABASE_SERVICE_ROLE_KEY_TEST, STRIPE_TEST_* |

---

## Patch kit status

- [x] Foundation: auth, persistence, rate limiting, CORS
- [x] Monetization: Stripe Checkout + Portal + webhook
- [x] Entitlements: server-side tier + quota gates
- [x] Public API: leaderboard, cappers, profiles, follows
- [x] Posts + feed + likes + comments (full social graph)
- [x] Grading: MLB boxscore fetcher + grade service + cron
- [x] Frontend: auth gate, legal gate, useAuth hook, admin dashboard
- [x] Admin: beta waitlist, user mgmt, capper CRUD, manual grading
- [x] Anti-fraud: removes all fabricated social proof
- [x] Cleanup: dead files, branding, deployment config
- [x] Tests: Vitest smoke suite (5 test files) + CI workflow
- [x] Legal: ToS + Privacy Policy drafts (need counsel review)

## Known gaps (intentionally not addressed)

| Gap | Reason | Recommended action |
|-----|--------|--------------------|
| Tests | Out of scope for a 3-week beta push | Add Vitest + Playwright smoke tests in week 4 |
| Real-time pick grading | Beta can tolerate nightly batch grading | Add Supabase Realtime subscription post-beta |
| Terms of Service / Privacy Policy text | Legal document — needs counsel | Use Termly template, have lawyer review |
| Redis-backed rate limiting | Single-instance is fine for beta | Add Upstash Redis when you scale beyond 1 instance |
| Sentry / PostHog integration | Monitoring, not beta-blocking | Add in week 4 before public launch |
| Parlay grading | Complex — needs multi-leg resolution logic | Marked `parlay_grading_not_implemented` in gradingService.ts. Manual review for now. |
| Mobile app | Different timeline | Use Capacitor to wrap the PWA for v1 mobile |

---

## Support

If a patch doesn't apply cleanly or a route returns an unexpected error,
the most likely causes are:

1. **Import path mismatch** — the patch kit assumes the directory structure
   in your repo. Adjust import paths if your structure differs.
2. **Missing `daily_quotas` table** — see the comment at the bottom of
   `server/middleware/entitlements.ts` for the SQL to add it.
3. **Stripe webhook signature fails** — ensure the webhook route is
   registered with `express.raw()` BEFORE `express.json()` (see
   `server.ts.patch.md`).
4. **CORS blocks everything in production** — set
   `CORS_ALLOWED_ORIGINS` env var to your frontend URL(s).

For the full story, read `IMPLEMENTATION.md` end-to-end before starting.
