# VouchEdge — AI Studio & Freemium Platform

A production-grade, secure full-stack web application featuring robust authentication, real-time data persistence, automated tier gating, and integrated Stripe subscriptions.

[Live Demo Link Here] | [Home Run Intelligence](#-home-run-intelligence) | [Live Games](#-live-games) | [Design System](#-shared-design-system) | [Architecture Overview](#-architecture--tech-stack)

---

## 🚀 Tech Stack

* **Frontend:** TypeScript, Tailwind CSS
* **Backend:** Node.js, Express.js
* **Database & Auth:** Supabase (PostgreSQL, Row Level Security, JWT Auth)
* **Security & Validation:** Zod, Express Rate Limit, Helmet, Custom Middleware
* **Payments & AI:** Stripe Billing Webhooks, Google Gemini API

---

## 🛠️ Engineering Highlights & Architecture

* **Secure Tier Gating & Entitlements:** Implemented custom backend middleware (`requireTier`, `requireTierOrQuota`) to manage free-tier daily limits and premium subscription access.
* **Robust Request Validation:** Leveraged **Zod** schemas across all API endpoints to ensure strict type safety and data integrity for user payloads.
* **Stripe Integration:** Handled complex subscription lifecycles securely using raw-body webhook verification and automated billing portals.
* **Database Security:** Designed a complete PostgreSQL schema protected by Supabase **Row Level Security (RLS)** policies and custom triggers.

---

## ⚾ Home Run Intelligence

The flagship board. Scores every hitter on the MLB slate for home-run likelihood,
labels each candidate **confirmed** or **projected**, and keeps the receipts
visible after the game ends.

**Routes:** `/hr-board`, `/daily-hr-board`, `/daily-hr-watch-new`
**Entry point:** [`src/features/hr/pages/HomeRunIntelligencePageZ8.tsx`](src/features/hr/pages/HomeRunIntelligencePageZ8.tsx)
**Access:** public — signed-out visitors get the full board; vouching and slip-building prompt sign-in.

### The command deck

One hero surface carries the page's identity and its slate vitals. It shares its
visual language with the Sports Intelligence Brain page — dotted evidence field,
orbit ring, hairline rails, pulsing product mark — so the two read as one product.

| Element | What it does |
|---------|--------------|
| Slate rail | Four vitals in one row: game count, feed freshness + age, confirmed count, preview count |
| Live pill | `LIVE SLATE` on today's date, `HISTORICAL` on any back-date |
| Date picker | Any date up to today; the board re-scores against that slate |
| Refresh | Manual re-fetch with spinner state; the board keeps the last-good snapshot rather than blanking |

Freshness is honest by design. A recovering feed demotes to a **last-good snapshot**
with a visible banner and request ID, and a slate with no posted lineups says so
instead of inventing confirmations.

### Source modes and tiers

Every candidate is labelled by how much the data actually supports it.

| Source mode | Meaning |
|-------------|---------|
| **Confirmed** | Player appears in an official MLB batting order |
| **Preview** | Scored from a projected lineup — explicitly not confirmed |
| **All signals** | Both, each still individually labelled |

Tier filters — **Elite**, **Strong**, **Watch**, **Sleeper** — stack with source
mode and free-text search across player and team names. When no official lineups
have posted yet, the board auto-switches to preview and says why.

### Workspaces

Five lenses over the same scored slate, switchable without a reload.

| Workspace | What it surfaces |
|-----------|------------------|
| **Overview** | The tiered candidate board — the daily default |
| **Edge Desk** | Model HR probability vs. sportsbook implied odds; ranks +EV candidates with max and average edge |
| **Slate Stacks** | Team-level home-run stack combinations for correlated plays |
| **Projection Matrix** | 2D scatter with selectable axes — hitter power, pitcher vulnerability, HR score, recent form, park factor, community vouch score |
| **Extremes** | Peak slate signals and outliers: highest HR score, strongest hitter power, and other per-metric leaders |

### View modes

The Overview board renders three ways, and the choice persists to `localStorage`.

* **Cards** — tiered columns on desktop, swipeable tier tabs on mobile
* **Table** — dense spreadsheet with sticky headers, ranked by signal score, condensed to player/score/matchup/actions on mobile
* **Map** — treemap signal field sized by score

### Player research

Opening a player pushes a real URL, so research is linkable and the browser back
button closes the drawer. The dossier covers overview, scoring charts, a matchup
pressure matrix, an impact timeline, and a decision delta explaining what moved
the number.

### Scoring layers

Each row carries an overall HR score plus its component sub-scores (0–100), so
the number is always decomposable:

`hitterPower` · `pitcherVulnerability` · `pitchMix` · `parkFactor` · `weather` ·
`platoon` · `recentForm` · `swingDecisions` · `lineupContext` · `bullpen` ·
`bvpScore` · `vegasEdgeScore` — alongside `dataConfidence`, `truthStatus`,
`riskTier` and American book odds.

The headline number is a **composite matchup score, not an estimated home-run
probability**, and the UI says so at the point of display rather than in the fine print.

### Community and slip integration

Players can be vouched directly from the board, the table or the profile drawer.
A **Most Vouched** panel ranks the slate's community-backed bats, and any
candidate can be pushed into the parlay builder with its reasoning and risk
snapshot attached.

### Performance and mobile

* **No loading chunks.** Lazy chunks for the table, profile drawer and vouch panel warm on idle after mount — switching to Table renders in **under 120ms** with the skeleton never painting.
* **No layout jump.** Every Suspense boundary holds a correctly-sized skeleton; nothing collapses and pops.
* **Mobile-first.** Hero controls wrap, the slate rail folds to 2×2, workspace tabs are 44px snap-scroll targets, and there is no horizontal page scroll at 375px.
* **Motion respects preference.** Reveal and transition animations are disabled under `prefers-reduced-motion`.

### Feature flags

[`src/features/hr/featureAvailability.ts`](src/features/hr/featureAvailability.ts)

| Flag | Default | Controls |
|------|---------|----------|
| `HR_MAP_ENABLED` | `true` | Treemap signal-field view mode |
| `HR_EXPORT_ENABLED` | `false` | CSV export of the visible board |

---

## 📡 Live Games

Real-time telemetry for the MLB slate. Official game state first — scores,
innings and line scores straight from the feed — with research layered on only
where a verified source backs it.

**Route:** `/live_games` (also `/live-projections`)
**Entry point:** [`src/components/LiveGamesProZ8.tsx`](src/components/LiveGamesProZ8.tsx)
**Access:** public.

### The command deck

Same grammar as Home Run Intelligence, different accent — rose reads as in-play
across the app, cyan carries the telemetry.

| Element | What it does |
|---------|--------------|
| Vitals rail | Live now / Upcoming / Final counts, plus feed state and last sync time |
| Feed pill | `STREAMING`, `RECONNECTING` or `OFFLINE` — the poll's real state, not a decoration |
| Fast sync | Forces a refetch of both the live feed and the HR board |
| Filter tabs | All games · Live now · Upcoming · Final, each with a live count |

Polling is adaptive: roughly **12s while games are live, 60s when idle**, and it
pauses entirely when the tab is hidden. Schedule order is preserved across polls,
so a refresh never reshuffles the slate under your cursor.

### Game spotlight

The selected game gets a full scoreboard: team logos, big tabular score,
inning-by-inning line score with runs/hits/errors, venue and status. On mobile
it collapses to a single compact row rather than a ~500px stack.

Below it, the page swaps in the panel that fits the game's state:

* **Live** — pitch-by-pitch sweat stream (~6s cadence): current pitcher, batter, count, outs, runners, win probability and the live play description
* **Pregame** — AI read panel for a game that hasn't started
* **Final** — game recap panel

### Slate grid

Every game on the slate as a compact score card — venue, status badge, both
teams with logos and scores. Live games carry a rose left edge so they stay
findable even when another card is selected. Cards are `contain: layout paint`,
so a poll tick can't thrash the grid's layout.

### Matchup drawer

Opening a matchup slides in a side panel with the live scoreboard, the full line
score, ballpark physics, and that game's active HR signals — each one addable
straight to the parlay slip. The drawer locks body scroll, closes on **Escape**
or backdrop click, and is a proper `role="dialog"` with `aria-modal`.

Ballpark conditions render in an explicit **Feed Offline / No reading** state
until a weather source is wired in, rather than displaying placeholder numbers
as if they were live readings.

### Performance and mobile

* **No loading chunks.** The at-bat stream, ballpark widget, pregame read and final recap are lazy chunks warmed on idle — a game going live never triggers a visible fallback.
* **No layout jump.** The initial skeleton mirrors the real layout (spotlight hero, then the slate grid) instead of four generic boxes, and every Suspense boundary is sized.
* **Mobile-first.** Compact single-row scoreboard, 2-up slate grid at 172×111, 44px filter tabs with snap-scroll, full-width drawer with safe-area padding, no horizontal page scroll at 375px.

---

## 🎛 Shared design system

Both intelligence surfaces run on one stylesheet:
[`src/styles/command-deck.css`](src/styles/command-deck.css).

It carries the grammar — dotted evidence field, orbit ring, hairline vitals rail,
pulsing product mark, sized loading holds, reveal motion — and each page supplies
its own accents:

```css
.hr-deck   { --deck-accent: #00f0ff; --deck-accent-2: #00ff94; }  /* signal cyan / confirmed emerald */
.live-deck { --deck-accent: #ff4d6d; --deck-accent-2: #00f0ff; }  /* in-play rose / telemetry cyan */
```

The look originated on the Sports Intelligence Brain page
(`src/features/brain/brain.css`), which is currently hidden. Keeping the grammar
shared means it returns into a family that already matches it.

All motion in the system is disabled under `prefers-reduced-motion`.

---

## 💻 Local Development (Quickstart)

```bash
# 1. Clone the repository and install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env.local

# 3. Run the development server
npm run dev

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

