# TD Next Truth Platform Task Checklist

**Plan:** `2026-08-22-td-next-truth-platform`
**Status:** IMPLEMENTED_PENDING_PROVIDER

## Approval

- [x] User explicitly approves implementation after reviewing the plan.
- [x] Change plan status from `WAITING_APPROVAL` to `APPROVED`.

## Preserve and Baseline

- [x] Reinspect the dirty worktree and preserve unrelated/user-owned edits.
- [x] Capture current focused test, typecheck, build, API timing, payload, and browser baselines.
- [x] Confirm provider credentials and licensed capabilities without printing secrets. Result: Redis present; provider key/URL absent; persistence disabled.

## Contract and Provider

- [x] Add the canonical TD Board V2 server contract.
- [x] Add matching client types for provenance, freshness, completeness, cursor, and connection state.
- [x] Add provider capability and normalized receipt interfaces.
- [x] Implement the SportsDataIO adapter behind strict configuration validation.
- [x] Keep ESPN outside the V2 candidate contract; V2 accepts only complete licensed provider rows.
- [x] Remove random/fabricated fallbacks from the V2 path.

## Persistence and Hub

- [x] Add the additive Supabase V2 snapshot/receipt/outcome migration. Not applied remotely.
- [x] Add safe RLS/service-role policies and indexes in the migration.
- [x] Implement the canonical TD board hub.
- [x] Add L1/Redis L2 caching, in-flight dedupe, versioned keys, and bounded last-good behavior.
- [x] Attach source and freshness metadata to every candidate and response.

## API and Client

- [x] Add the cursor-paginated `/api/nfl/td-board/v2` route.
- [x] Add validation, timeouts, cancellation, structured errors, and response diagnostics.
- [ ] Preserve V1 only as a clearly labelled, feature-flagged compatibility path.
- [x] Connect React Query to V2 with shared caching and prefetch.
- [x] Add `live`, `refreshing`, `partial`, `stale`, `unavailable`, and `not_configured` UI states.
- [x] Keep the initial payload under 200 KB and render candidates incrementally. Measured empty-state payload: 628 bytes.
- [x] Verify no error path silently injects mock data.

## Refresh, Evaluation, and Rollout

- [x] Add deduplicated background prewarm/refresh wiring.
- [/] Add structured provider/cache/API metrics. Per-response cache/duration diagnostics exist; production percentile aggregation remains external.
- [x] Add stored-outcome backtesting with a declared baseline and calibration metrics. Execution awaits stored pairs.
- [ ] Add `TD_BOARD_V2_ENABLED` with shadow/staff rollout stages.
- [/] Document provider gaps, configuration, stale limits, and rollback. Environment contract and code path are documented; production runbook remains.

## Verification Gates

- [x] Focused unit and component tests pass: 15/15.
- [/] Route-contract, provider-normalization, cache, pagination, and stale-state tests pass. Provider/cache/client route coverage passed; controlled last-good failure awaits a provider fixture.
- [x] TypeScript check passes.
- [x] Production build passes (existing chunk-size/dynamic-import warnings remain).
- [x] Measured warm local API p95 is below 100 ms: 4.937 ms across 20 requests.
- [ ] Measured healthy cold API response is below 1 second.
- [x] Initial payload is below 200 KB: 628 bytes in the not-configured state.
- [ ] First useful production render is below 1.5 seconds.
- [x] Authenticated desktop and 390px mobile browser checks pass on `/td-next`; no horizontal overflow or console errors.
- [x] Chronos verification ran against the mounted local route. No asset/CSS/MIME/page errors; fresh unauthenticated selector assertion cannot reach the protected panel, which was verified in the signed-in in-app tab.
- [x] No promotion claim is made unless calibration and sample-size gates pass.
- [x] Record exact passes, failures, skipped checks, and external blockers.

## Completion

- [ ] Update plan/task status to `COMPLETE` only when all authorized gates are satisfied.
- [x] Report changed files, measured outcomes, provider/account requirements, and rollback path.
