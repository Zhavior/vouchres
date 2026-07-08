# VouchEdge Z8 Native Lens Kill Map

## Mission

VouchEdge must become one native SaaS body, not a collection of converter-lens pages.

Nikon Z8 body = VouchEdge platform core:
- app shell
- auth/session
- API client
- canonical data contracts
- design tokens
- loading/empty/error states
- backend truth
- results ledger truth
- profile/subscription truth

Native Z lens = every visible page/component/API/store that speaks the same contracts.

Converter lens = old pages, duplicate routes, random props, local-only truth, legacy state sync, inconsistent motion imports, theme drift, and pages that expect data fields the core body does not provide.

## Current Production Truth

Build passes, but full TypeScript still shows active product contract drift.

The app is not fully Z-lens yet.

## Current Error Buckets

### 1. Billing / Privacy Contract

Files:
- server/routes/privacyRoutes.ts
- server/services/billing/stripeService.ts

Problem:
- privacyRoutes expects stripeService.stripe.
- stripeService does not export stripe in that shape.

Z8 decision:
- Billing/privacy must use one billing service boundary.
- Routes should not reach into random internal service fields.
- Create explicit billing service methods or export a typed Stripe client intentionally.

Status:
- REPLACE CONTRACT.

### 2. App Shell / Feed Contract

Files:
- src/App.tsx
- src/social/feed/HomeFeedLayout.tsx
- src/social/feed/FeedMobileNav.tsx

Problem:
- App passes isRouteSwitching to HomeFeedLayout, but HomeFeedLayoutProps does not accept it.
- FeedMobileNav requires profile but receives only activeSection/onSectionChange.

Z8 decision:
- One AppShell contract.
- One Feed layout contract.
- Route switching/loading belongs in shell or shared layout state, not random props.

Status:
- REPAIR NATIVE SHELL CONTRACT.

### 3. Motion Import Contract

Files:
- src/components/AisFeatureAgent.tsx
- src/components/AisLandingPage.tsx
- src/components/auth/AuthModal.tsx
- src/components/NbaNflArena.tsx
- src/components/vouchedge/EpicThemeShowcase.tsx

Problem:
- Components import AnimatePresence/useMotionValue/useTransform/useSpring from motion/react, but installed export shape does not match.

Z8 decision:
- One animation import boundary.
- Use either framer-motion consistently or create src/lib/motion.ts wrapper.

Status:
- QUARANTINE WITH MOTION WRAPPER.

### 4. Results Ledger Contract

Files:
- src/components/ResultsPage.tsx

Problem:
- Missing triggerNotification.
- Missing loadBackendLedger.
- BackendLedgerResponse does not have picks.

Z8 decision:
- Results Ledger must be backend truth only.
- UI should not invent ledger shape.
- Create one BackendLedgerResponse adapter.

Status:
- REBUILD RESULTS LEDGER LENS.

### 5. AI / MLB Data Contract

Files:
- src/components/SmartAiEngine.tsx
- src/lib/aiParlayGenerator.ts

Problem:
- MLBPlayer missing gamePk/gameId/teamId/gameStartTime.
- StarterCandidate missing playerId/teamId.

Z8 decision:
- One canonical MLB entity model:
  - playerId
  - playerName
  - teamId
  - team
  - gamePk/gameId
  - gameDate
  - gameStartTime
  - market context
- AI and Parlay must use the same identity fields.

Status:
- CREATE NATIVE MLB DATA MODEL.

### 6. Theme / Settings Contract

Files:
- src/components/EpicThemeShowcase.tsx
- src/components/vouchedge/EpicThemeShowcase.tsx
- src/theme/themeRegistry.ts
- src/components/SettingsPage.tsx

Problem:
- ThemeStoreProps mismatch.
- themeRegistry category "VouchEdge" not allowed.
- SettingsPage union narrowing error for error response.

Z8 decision:
- One theme registry.
- One token category union.
- One settings response helper.

Status:
- REPAIR DESIGN TOKEN CONTRACT.

### 7. Edge Shell Contract

Files:
- src/components/theEdge/TheEdgeShell.tsx
- src/components/theEdge/EdgeValueDeck.tsx
- src/components/TheEdgePage.tsx

Problem:
- stats expected by Edge shell do not match provided stats.
- savedPicks/proofScore missing.
- badge tone "violet" not allowed.
- TheEdgePage missing open/onClose props.

Z8 decision:
- Edge shell must become a proper page lens or modal lens, not both.
- One EdgeStats contract.

Status:
- REBUILD EDGE LENS CONTRACT.

### 8. Misc Visible Page Contract

Files:
- src/components/LiveGamesPro.tsx
- src/components/MlbIntelligenceHub.tsx
- src/components/SubscriberHub.tsx
- src/components/welcomePortal/WelcomeFeatureSell.tsx
- src/pages/DailyPlayersPage.tsx

Problem:
- missing hrWatch on GameMatchup
- missing setCopyMessage
- missing user
- JSX namespace issue
- button handler signature mismatch

Z8 decision:
- Fix one visible page lens at a time after core contracts are native.

Status:
- BACKLOG AFTER CORE CONTRACTS.

## Replacement Order

### Phase 1 — Typecheck Scope And Contract Hygiene
Goal:
- Full production tsc should expose only real active app issues.
- No backup/reference/debug code inside production typecheck.
- No temporary console traces.

Actions:
- Done: moved backup/reference files out of src.
- Done: removed PARLAY_TRUTH debug.
- Next: commit cleanup only if tracked changes exist.

### Phase 2 — Native App Shell
Goal:
- App.tsx stops being the entire product brain.
- Create one AppShell/PageShell contract.
- Fix HomeFeedLayout and FeedMobileNav prop drift.

### Phase 3 — Native Design/Animation System
Goal:
- One token system.
- One animation import wrapper.
- One card/button/loading/empty/error system.

### Phase 4 — Native Data Contracts
Goal:
- MLBPlayer canonical type.
- BackendParlay canonical type.
- Ledger canonical type.
- FeedPost/Vouch canonical type.
- Profile/subscription canonical type.

### Phase 5 — Rebuild Visible Feature Lenses
Order:
1. Home / Dashboard
2. Feed / VouchBoard
3. Player Research / Daily Players
4. Smart AI
5. Parlay Command Center
6. Live Parlays
7. Results Ledger
8. Profile / Subscriber Hub
9. Theme / Settings
10. Edge Lab

### Phase 6 — Delete Old Islands
Only delete after replacement owns the job and build + tsc + browser test pass.

## Rules

- Do not let localStorage be backend truth.
- Do not let UI pages trigger grading/backfill during normal reads.
- Do not use void as delete/archive.
- Do not let multiple save routes own the same entity.
- Do not add premium/reuse/vouch polish until native contracts are clean.
- Do not trust npm run build alone.
- Every visible page must use the same shell, token, loading, error, and data-contract rules.
