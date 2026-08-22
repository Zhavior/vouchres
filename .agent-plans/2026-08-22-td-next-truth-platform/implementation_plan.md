# TD Next Truth Platform Implementation Plan

**Status:** IMPLEMENTED_PENDING_PROVIDER
**Slug:** `2026-08-22-td-next-truth-platform`
**Repository:** `/Users/boydsantos/Desktop/Projects/Vouch/vouchres`
**Mode:** FULL
**Workers:** 0
**Approved:** 2026-08-22 (`go for it`)

## Goal

Turn TD Next from a fast projection preview into a truthful, source-backed NFL touchdown decision desk. Preserve the speed improvements already in the dirty worktree while adding a versioned data contract, real provider ingestion, durable snapshots, bounded last-good caching, honest UI states, observability, and evidence-based promotion gates.

## Current Evidence

- Vouchres is React 19 with Vite and Express; replacing the page or changing frameworks is not the first move.
- The current speed work already adds backend concurrency/cache, React Query sharing/prefetch, a capped initial payload, and batched tier rendering.
- The remaining product risk is data truth: TD Next still contains static or synthesized fields that cannot be presented as current provider facts.
- SportsDataIO is the best initial fit because its official NFL coverage includes rosters, depth charts, injuries, weather, odds, player props, live stats, red-zone stats, and historical data. A paid production agreement and credentials remain a separate user decision.

## Success Gates

- Zero random or fabricated values on the V2 path.
- Every surfaced metric has `source`, `sourceUpdatedAt`, and `ingestedAt` metadata.
- Warm API p95 below 100 ms and healthy cold API response below 1 second.
- Initial response below 200 KB and first useful production render below 1.5 seconds.
- A stale response visibly states its age and never exceeds the configured last-good limit.
- Provider failure produces a truthful stale, unavailable, or partial state—not silent mock data.
- Model promotion is blocked until an adequate completed-game sample beats a declared simple baseline on calibration metrics such as Brier score and log loss.
- Focused tests, typecheck, production build, API benchmarks, authenticated browser verification, and Chronos verification pass before completion is claimed.

## Implementation Phases

### 1. Canonical V2 truth contract

- Add `server/services/nfl/contracts/tdBoardV2.ts` for the canonical server response.
- Extend `src/types/touchdown.ts` with provider provenance, freshness, completeness, nullable inputs, connection state, cursor metadata, and version identifiers.
- Separate provider facts, derived features, model outputs, and UI labels so the client cannot mistake one category for another.
- Remove random or fabricated fallbacks from the V2 path. Unknown values remain `null` with a reason.

### 2. Provider abstraction and ingestion

- Add `server/services/nfl/providers/types.ts` for provider capabilities and normalized receipts.
- Add `server/services/nfl/providers/sportsDataIoProvider.ts` as the recommended primary adapter.
- Keep `server/services/nfl/nflEspnService.ts` limited to supported schedule, event, and identity data; do not imply that ESPN supplies unavailable TD-prop or red-zone fields.
- Add strict environment validation and explicit capability reporting when credentials or licensed feeds are unavailable.
- Do not purchase a plan, accept a contract, or insert production secrets as part of implementation.

### 3. Durable snapshots and audit receipts

- Add `supabase/migrations/20260822120000_td_intelligence_v2.sql`.
- Create versioned tables for board snapshots, candidate snapshots, provider receipts, and completed outcomes.
- Store raw receipt hashes/references, normalized feature values, timestamps, model version, and outcome linkage.
- Restrict writes to trusted server roles and add only the minimum read policies needed by the product.

### 4. Canonical hub and bounded cache

- Add `server/services/hubs/tdBoardHub.ts` as the single assembly path.
- Reuse `server/lib/hybridTTLCache.ts` and `server/lib/upstashRedis.ts` for in-process L1 plus Redis L2 caching.
- Add in-flight request deduplication, cache-version keys, stale-while-revalidate, and a bounded last-good snapshot.
- Return provenance and freshness metadata with every response, including partial-provider coverage.

### 5. Versioned API and pagination

- Update `server/routes/nflRoutes.ts` with `/api/nfl/td-board/v2?cursor=<cursor>&limit=<limit>`.
- Keep the existing endpoint temporarily as a compatibility path behind an explicit feature flag.
- Return a small initial page, stable ordering, opaque cursors, response timing, source coverage, and cache status.
- Add request cancellation, timeouts, input validation, rate protection, and structured error responses.

### 6. Client connection and rendering

- Update `src/features/nfl-touchdown/queries/`, `src/features/nfl-touchdown/hooks/useTouchdownEngine.ts`, and TD Next components to consume only the V2 contract when enabled.
- Preserve shared React Query caching, hover prefetch, and incremental TierBoard rendering.
- Add truthful states: `live`, `refreshing`, `partial`, `stale`, `unavailable`, and `not_configured`.
- Show last update time, source coverage, and stale age without blocking the usable cached board.
- Never substitute mock candidates after a provider or API failure.

### 7. Prewarm and background refresh

- Add a bounded prewarm path using the existing server boot/job architecture.
- Refresh around schedule and market availability windows while preventing duplicate work across instances.
- Keep on-demand refresh as a fallback and ensure the UI never waits on nonessential enrichment.

### 8. Backtesting and calibration gates

- Add a reproducible backtest/evaluation service or script using stored snapshots and completed outcomes.
- Declare a simple baseline before evaluation and report sample size, date coverage, missingness, Brier score, log loss, and calibration buckets.
- Do not claim profitability, predictive advantage, or production readiness from a small or incomplete sample.
- Keep V2 in shadow/staff mode until its evidence gates pass.

### 9. Observability, rollout, and rollback

- Add structured metrics for upstream duration/errors, cache hit/stale rates, response size, record count, completeness, and API p50/p95/p99.
- Add `TD_BOARD_V2_ENABLED` and a staff/shadow rollout stage before wider release.
- Roll back by disabling V2; if V1 remains available, label it clearly as a projection preview rather than a live source-backed feed.
- Document configuration, last-good limits, provider capability gaps, and rollback steps.

### 10. Verification

- Add focused unit, route-contract, cache, provider-normalization, pagination, stale-state, and component tests.
- Run the relevant tests, TypeScript check, production build, and repeatable cold/warm API benchmarks.
- Verify `/td-next` in a real authenticated browser at desktop and mobile widths.
- Run Chronos against the mounted local route and fix only confirmed VouchEdge issues manually.
- Record measured results and remaining provider/account blockers without optimistic completion claims.

## Expected File Surface

### New

- `server/services/nfl/contracts/tdBoardV2.ts`
- `server/services/nfl/providers/types.ts`
- `server/services/nfl/providers/sportsDataIoProvider.ts`
- `server/services/hubs/tdBoardHub.ts`
- `supabase/migrations/20260822120000_td_intelligence_v2.sql`
- focused server/client tests for the V2 contract, caching, provider adapter, routes, and UI states

### Updated

- `server/routes/nflRoutes.ts`
- `server/services/nfl/nflEspnService.ts`
- server startup/job wiring and environment documentation
- `src/types/touchdown.ts`
- `src/features/nfl-touchdown/queries/*`
- `src/features/nfl-touchdown/hooks/useTouchdownEngine.ts`
- `src/app/td-next/components/TierBoard.tsx`
- `src/app/td-next/components/TdLedgerView.tsx`
- TD Next connection/status components and associated tests

Exact filenames may be narrowed after implementation begins, but scope cannot expand beyond this architecture without another review.

## Risks and Controls

- **Provider cost/licensing:** production-grade values require an appropriate paid feed. Stop at a working adapter and honest `not_configured` state if credentials are absent.
- **Coverage gaps:** player props, red-zone usage, injuries, and depth charts may update at different times. Preserve per-field provenance and partial states.
- **Historical sample quality:** do not promote the model when outcome coverage or sample size is inadequate.
- **Dirty worktree:** preserve all existing edits, inspect overlapping diffs before every patch, and stage nothing unrelated.
- **Migration safety:** make the migration additive and reversible; do not overwrite existing TD tables or data.
- **Offseason/sparse slate:** test empty and partial schedules as normal product states.

## Out of Scope

- Purchasing a provider subscription or accepting commercial terms.
- Adding production secrets or changing external provider accounts.
- Deploying, committing, pushing, or opening a pull request unless separately requested.
- Claiming betting profitability, guaranteed accuracy, or calibration success before measured evidence exists.
- Adding a second paid provider unless the primary provider's verified gaps require a separate decision.

## Approval Gate

**User Review Required**

Approved by Boyd on 2026-08-22 with `go for it`. Product-code implementation is authorized within this plan's scope.

Implementation completed locally on 2026-08-22. Live-provider, persistence, and calibration promotion gates remain blocked until a licensed SportsDataIO board URL/API key are supplied and the additive migration is applied.
