# VouchRes / VouchEdge — Mobile UI Critique, Judge API Review, Competitive Gaps & Store Readiness

**Audience:** founders + business + product  
**Scope:** vouchres mobile experience, AI Judge APIs, competitor apps, Apple App Store + Google Play path  
**Date:** 2026-07-18  
**Status:** Business brief (no code shipped in this doc)

---

## 1. Executive verdict

VouchEdge is a **strong research + trust product on web**, with a **usable but unfinished mobile shell**. It is **not App Store / Play Store ready**.

| Layer | Grade | One-line read |
|-------|-------|----------------|
| Mobile shell (nav, safe-area, PWA) | B− | Dock + drawer work; still feels like a website squeezed into a phone |
| Core mobile surfaces (Feed, HR, Today) | B | Usable after Z8 shell fixes; uneven polish |
| Secondary mobile surfaces | C | Settings / Results / Leaderboard / Parlay Studio not store-grade |
| AI Judge product surface | B | Distinctive brand (DS/PH/MR/RA); mobile consumption path is thin |
| Judge / AI APIs | B− | Auth’d review APIs exist; social-judge path is still `safe_prototype` |
| Competitive feature parity (mobile) | C+ | Trust + proof is the wedge; odds/tracking/alerts lag Action Network class apps |
| Store packaging (native wrapper, icons, legal wiring, payments) | D | PWA only; Capacitor/RN not started; counsel + compliance unfinished |

**Positioning that wins stores and users:**  
VouchEdge is **not a sportsbook**. It is a **trust-first MLB research + graded proof app** with a 4-judge AI panel and a public ledger. Store listing, IA, and copy must stay in that lane or Apple/Google will treat it like gambling and demand licenses VouchEdge does not have.

---

## 2. What mobile is today (code reality)

### Shell

| Piece | Path | Behavior |
|-------|------|----------|
| Bottom dock | `src/app/AppNav.tsx` | 5 tabs: Home Feed · Pro Edges · Vouch Board · Today · Menu |
| Profile drawer | `src/social/feed/MobileProfileDrawer.tsx` | X-style full nav + tier avatar + notifs + logout |
| Layout | `src/social/feed/HomeFeedLayout.tsx` | Single column &lt;768px; bottom padding for dock + safe-area |
| PWA | `public/manifest.json`, `service-worker.js` | Standalone installable web app; shortcuts to HR Board / Today |

**Note:** Older docs (`Z8_REDESIGN_MASTER_PROMPT.md`) say bottom nav was removed. **Current code has the dock back** plus the drawer. Treat audits that still cite `FeedMobileNav.tsx` as stale.

### Strengths already shipped

- Viewport + `viewport-fit=cover`, Apple web-app meta, theme color
- Safe-area padding on dock, drawer, HR drawers/filters
- 44px touch targets (`ve-touch-target`)
- Shell-wide 680px center-column lock fixed (was the root “nothing fits on mobile” bug)
- HR Board has real mobile adaptations (filter sheet, drawers)
- ParlayOS has a dedicated mobile slip dock
- Legal drafts exist (`legal/TERMS_OF_SERVICE.md`, `PRIVACY_POLICY.md`); signup has a 21+ / research-only policy step

### Hard gaps on mobile UI

1. **No native app** — README explicitly defers: *“Use Capacitor to wrap the PWA for v1 mobile.”*
2. **Desktop product density on a phone** — Pro Edges, Smart AI / judges, Parlay Studio, wide HR signal fields still read as desktop tools.
3. **Unaudited pages** — Leaderboard, Settings, Results, Theme Store, Subscriber Hub still need 375–430px QA (called out in Z8 notes).
4. **Wide-table debt** — e.g. HR signal field `min-w-[680px]` forces horizontal scroll.
5. **Chrome stacking** — bottom dock + ParlayOS slip dock (`bottom-[4.5rem]`) can compete for thumb space.
6. **Push incomplete** — service worker has `push` handlers; server can save subscriptions; **no client VAPID / `pushManager` subscribe UX**.
7. **Legal UI not fully mounted** — `LegalGate` / `CookieConsentBanner` exist but are not reliably wired into the app tree; age/jurisdiction mainly rides AuthModal + server checks.
8. **No splash / startup images**, incomplete maskable icon discipline, no universal links / App Links.

---

## 3. Judge + mobile API deep dive

### Canonical product: 4 judges (not 5)

| Code | Name | Role |
|------|------|------|
| DS | Data Scout | Math-first slate screening |
| PH | Power Hunter | HR threat radar |
| MR | Momentum Reader | Form & rhythm |
| RA | Risk Auditor | Trap / risk filter |

Frontend constants: `src/constants/aiJudges.ts`  
Landing deck: `LandingJudgesDeck` on `VouchEdgeTerminalPage`  
Backend: `server/services/aiJudges/*`, public registry/leaderboard under `/api/ai-judges/*`

### API inventory (what business needs to know)

| API | Auth | Purpose | Store / mobile readiness |
|-----|------|---------|--------------------------|
| `POST /api/judge/pick` | Auth + rate limit | Judge panel verdict on a pick | Solid building block; needs mobile UX that shows DS/PH/MR/RA clearly |
| `POST /api/judge/parlay` | Auth + rate limit | Same for parlays | Same |
| `POST /api/judge/bias` | Auth + rate limit | Bias audit | Differentiator if exposed as a one-tap “risk check” |
| `GET /api/ai-judges/registry` | Public | Agent dock metadata | Good for mobile agent strip |
| `GET /api/ai-judges/leaderboard` | Public | Graded AI judge performance | **Must** be a first-class mobile tab/card — competitors live on leaderboards |
| `POST /api/ai-judges/agents/:id/run` | (public routes) | Run agent | Cost + abuse controls matter before store scale |
| `/api/ai-judge-social/*` | Mixed; write paths staff | Social draft generator | Explicitly `safe_prototype` / **no real X posting** — do not market as live social posting |
| HR Board today APIs | Existing | Confirmed vs projected candidates | Trust differentiator; mobile cards must preserve honesty rules |

### Judge critique (product + API)

**What works**
- Clear personas and a trust narrative competitors do not copy well (especially RA as trap filter).
- Server-side judging exists separately from marketing landing deck — not only frontend theater.
- Leaderboard + pick ledger path exists for public proof.

**What’s missing for a mobile-first product**
1. **One-thumb Judge Home** — Today’s slate → 4 judge cards → “why” → save/vouch. Today judges are split across landing, Pro/Smart AI decks, and APIs.
2. **Explainability UX** — mobile users need short verdict chips + expandable reasoning, not desktop command decks.
3. **Honest mode labels** — social judge routes still advertise prototype mode; store reviewers + users will punish overclaim.
4. **Cost envelope** — generation/run endpoints need quotas visible in-app (already an entitlements theme on web; mobile must surface remaining runs).
5. **Offline / bad network** — SW caches shell; judge/HR payloads need stale-while-revalidate messaging (“as of 6:42pm ET”) so trust isn’t broken when the API fails on cellular.

---

## 4. Competitive landscape — what other apps have that we don’t

Framed vs **Action Network, BettingPros, OddsShark, BetQL, Unabated, Pikkit / social trackers** (research class, not DraftKings/FanDuel sportsbooks).

### Feature gap matrix (mobile app end)

| Capability | Category leaders | VouchEdge today | Gap severity |
|------------|------------------|-----------------|--------------|
| Native iOS + Android apps | Action, BettingPros, OddsShark | Web/PWA only | **P0 for stores** |
| Live odds comparison / line shopping | Action, OddsShark, Unabated | Odds often estimated / TBD; not a shopping UX | P1 (optional if we stay research-only) |
| Bet sync / bankroll tracker | Action BetSync, BettingPros | Results / vouch ledger (research proof), not sportsbook sync | P1 for mass market; P2 if we own “proof not bankroll” |
| Push alerts (line moves, picks, starts) | All major apps | SW hooks only; no subscribe UX | **P0** |
| Public % / sharp money | Action | Not core | P2 (don’t fake it) |
| Expert / social follow graph | Action, Pikkit | Feed + cappers + follows — **real strength** | Polish + discovery |
| Player props deep board | BettingPros | HR-heavy MLB focus | P1 for multi-sport expansion |
| Same-game parlay builders | Many | ParlayOS / AI parlays — promising but desktop-heavy | P0 mobile layout |
| Graded public track record | Sparse / opaque elsewhere | **Public proof ledger + AI judge leaderboard** | **Defend & feature** |
| Trust / projected vs confirmed lineups | Rare | **HR Board honesty rules** | **Defend & feature** |
| Onboarding under 60s | Best apps | Auth + plan + policy wizard is thorough but long | P1 shorten for mobile |
| Widgets / Live Activities / shortcuts | Best apps | Manifest shortcuts only | P2 after Capacitor |

### Strategic takeaway for business

Competitors win on **distribution (native apps)**, **odds liquidity**, and **habit loops (alerts + bet tracking)**.

VouchEdge should **not try to out-Action Action** on odds screens first. Win the store narrative on:

1. **Trust-first HR / slate research** (confirmed vs projected, never fake odds/weather/injuries)  
2. **4-judge AI panel with graded history**  
3. **Social vouches + public proof** (wins *and* losses)  
4. **Capper reputation that is graded, not manufactured**

That is a defensible App Store story: *“MLB research & proof — not a sportsbook.”*

---

## 5. Mobile UI critique (design / UX judge)

### What feels right

- **Dock IA is mostly correct** for a social-research hybrid: Feed · Edges · Board · Today · Menu.
- **Drawer for depth** avoids the old “14 icons never fit” bottom-nav failure.
- **Tier-colored avatar** is a good retention / status cue (Basic / Pro / Capper).
- **HR mobile sheets** show the team knows phone patterns when they focus.

### What feels weak vs store-grade apps

1. **Brand in chrome, not in product moments** — dock icons are functional; first-open after install needs a single branded “Today’s board” hero moment, not a desktop feed.
2. **Too many workspaces for a phone** — featureConfig density (labs, arenas, theme store, etc.) belongs behind progressive disclosure; Menu drawer currently dumps the whole product map.
3. **Labels vs icons** — dock is icon-only; competitors use tiny labels. Store users bounce when “Pro Edges” is a flame with no text.
4. **Parlay Studio “rotate phone”** is a surrender, not a mobile design.
5. **Dark terminal aesthetic** is fine if intentional, but must stay consistent (Z8 tokens) — leftover legacy CSS still risks looking like two apps.
6. **Empty / loading / error states** must be productized for cellular; store reviews punish spinners and blank boards.
7. **Accessibility** — Dynamic Type, VoiceOver/TalkBack labels, contrast on emerald/cyan chips need a pass before review.

### Recommended mobile IA (v1 store)

**Primary tabs (keep 5):**
1. **Today** — slate + HR top threats (default for install?)  
2. **Judges** — DS/PH/MR/RA cards + leaderboard (elevate from buried Pro)  
3. **Board** — vouches / proof  
4. **Feed** — social  
5. **You** — profile, settings, upgrade, legal  

Move “Pro Edges / labs / arenas” into You → Labs or a single Pro hub with one scroll, not 12 peer nav items.

---

## 6. App Store + Google Play readiness

### Critical legal framing (read before building native)

VouchEdge ToS already states it is **not a sportsbook**. Keep it that way.

| If we… | Store implication |
|--------|-------------------|
| Stay research / education / record-keeping, no wagering, no deposits | Can ship as **sports / productivity / entertainment** research app with clear disclaimers, 17+/18+ rating, age gate |
| Add real-money betting, deposits, or “place bet” deep links that facilitate gambling | Triggers **Apple 5.3 / Google real-money gambling** rules → licenses, geo-fence, AO rating, no IAP for wagering funds |

**Recommendation:** Store v1 = **research + social proof + AI judges**. No sportsbook CTAs. Stripe stays for **subscriptions** (Pro/Capper), not betting wallets. Confirm IAP vs external Stripe rules with counsel (digital subscriptions often require Apple IAP on iOS).

### Pre-store checklist

#### A. Product / UX (blockers)

- [ ] Capacitor (or RN) wrapper around production web build **or** true native shell
- [ ] Mobile QA matrix at 375 / 390 / 430 for every primary tab
- [ ] Fix horizontal overflow (HR signal field, tables)
- [ ] Mobile ParlayOS: vertical slip, no “rotate device” as primary UX
- [ ] Judge Home + leaderboard as first-class mobile surfaces
- [ ] Push opt-in onboarding + settings toggle (iOS permission copy)
- [ ] Offline / degraded API banners with timestamps
- [ ] Crash-free session rate monitoring (Sentry) on TestFlight / Play internal track

#### B. Packaging

- [ ] Apple Developer + Google Play Console accounts (org, DUNS if needed)
- [ ] App icons: 1024 App Store, adaptive Android, separate maskable assets (don’t ship SVG as only maskable)
- [ ] Splash / launch screen
- [ ] Screenshots: 6.7" + 6.5" iPhone, iPad if supported; phone + 7" tablet Android
- [ ] Privacy Nutrition Labels / Data safety form aligned to `PRIVACY_POLICY.md`
- [ ] Support URL, marketing URL, privacy URL (live, not localhost)
- [ ] Age rating questionnaire answered truthfully (gambling-adjacent content → higher rating even if not a sportsbook)

#### C. Compliance / trust

- [ ] Counsel-reviewed ToS + Privacy
- [ ] Mount `LegalGate` + cookie/consent where required
- [ ] 21+ (or jurisdiction-correct) gate before pick posting; consider gate before sensitive research if counsel advises
- [ ] In-app responsible-use / “not a sportsbook” footer on Judge + HR + Parlay
- [ ] Account deletion + data export (privacy routes exist — verify UX path in Settings)
- [ ] No fabricated social proof (already a product rule — enforce in store screenshots too)

#### D. Payments

- [ ] Decide: **Stripe web checkout** vs **Apple IAP / Google Play Billing** for subscriptions
- [ ] If native + digital subscription features → plan for store billing or reader-app exemption strategy with counsel
- [ ] Restore purchases / manage subscription links

#### E. Technical store requirements

- [ ] ATS / HTTPS only; no mixed content
- [ ] Universal Links (Apple) + App Links (Android) for `/hr-board`, `/today`, share cards
- [ ] Background modes only if justified (push)
- [ ] Permission strings: notifications, photo library (avatar), tracking (if ATT)
- [ ] 64-bit, current Xcode / target SDK, Play target API level
- [ ] Production track smoke: cold start &lt; ~3s on mid device, login, Today, HR, one judge verdict, logout, delete account

### Phased plan (technical, not calendar estimates)

**Phase 0 — Mobile web hardening (before wrapper)**  
Ship P0 UI fixes + Judge Home + push subscribe + legal mount. Prove retention on installed PWA.

**Phase 1 — Capacitor v1**  
Wrap current Vite app; ship TestFlight + Play internal. Same codebase, native shell, splash, push via FCM/APNs bridge.

**Phase 2 — Store submission**  
Screenshots, privacy forms, subscription policy decision, review notes explaining “research not gambling,” demo account for reviewers.

**Phase 3 — Native habit loops**  
Widgets, Live Activities (game day), share extensions for vouch cards, deeper offline cache for Today/HR.

**Phase 4 — Selective parity**  
Only add odds shopping / bet sync if it does **not** reclassify the app; otherwise partner via “export research” not “place bet.”

---

## 7. What’s missing on the apps end (priority stack for business)

### P0 — Without these, do not submit

1. Native wrapper (Capacitor) + store listing assets  
2. Push notifications end-to-end  
3. Mobile Parlay + HR overflow fixes  
4. Counsel-signed legal + mounted age/consent gates  
5. Subscription / IAP policy decision  
6. Reviewer demo account + “not a sportsbook” review notes  

### P1 — Without these, retention loses to Action Network

1. Judge Home + graded AI leaderboard on mobile home path  
2. Faster onboarding (policy step stays; reduce friction elsewhere)  
3. Bet/result tracking clarity (even if manual vouch logging, make it addictive and honest)  
4. Alert types: lineup confirmed, judge pick graded, followed capper posted  
5. Performance budgets on cellular  

### P2 — Differentiation / expansion

1. Multi-sport only after MLB mobile loop is excellent  
2. Widgets / Live Activities  
3. Odds comparison **as research**, clearly labeled, never fake lines  
4. Creator tools for cappers (already Capper tier — mobile compose + proof)

---

## 8. Messaging for store listings (draft)

**Name:** VouchEdge  
**Subtitle:** MLB research & graded proof  
**Short description:** Trust-first MLB intelligence — confirmed lineups, AI judges, and a public win/loss ledger. Not a sportsbook.

**Long description should emphasize:**
- Confirmed vs projected lineup honesty  
- Four AI judges with published track records  
- Social vouches with graded results  
- Research / entertainment only; 21+ where required  

**Do not say:** guaranteed winners, lock of the day, place your bet, casino language, fabricated win rates.

---

## 9. Suggested business decisions (need owner)

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Native strategy | Capacitor wrap vs rewrite RN | **Capacitor wrap** of current Vite app for v1 |
| Default tab after install | Feed vs Today vs Judges | **Today** (utility) with Judges card module |
| Compete on odds? | Build shopping vs skip | **Skip for v1**; partner later |
| Compete on bet sync? | Build vs skip | **Skip for v1**; double down on graded proof |
| Monetization in store | Stripe only vs IAP | **Counsel-led**; assume IAP needed if unlocking digital Pro inside iOS app |
| Social AI posting | Prototype vs real X | Keep prototype until compliance + brand safety signed off |

---

## 10. Source map (for engineers)

- Mobile dock: `src/app/AppNav.tsx`  
- Drawer: `src/social/feed/MobileProfileDrawer.tsx`  
- Shell: `src/social/feed/HomeFeedLayout.tsx`  
- Judges constants: `src/constants/aiJudges.ts`  
- Judge APIs: `server/routes/judgeRoutes.ts`, `server/routes/aiJudgeSocialRoutes.ts`, `server/routes/publicRoutes.ts` (`/api/ai-judges/*`)  
- PWA: `public/manifest.json`, `public/service-worker.js`  
- Legal: `legal/*`, `src/components/legal/*`, `src/components/auth/AuthModal.tsx`  
- Prior mobile notes: `Z8_REDESIGN_MASTER_PROMPT.md`, `README.md` (mobile deferred)

---

## Bottom line

VouchEdge’s **best store story is already in the product DNA** (trust, judges, proof). The **apps end is what’s missing**: native packaging, push, mobile-first Judge/Today IA, overflow polish, and compliance wiring. Competitors own alerts, odds, and bet sync; VouchEdge should own **honest research + graded AI + public accountability** — then wrap that loop for App Store and Google Play.
