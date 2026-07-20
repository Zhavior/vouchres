# Backend Rules

Apply this file for backend, data, runtime, worker, trust, billing, social, chat,
notification, and platform work under `server/`.

## Architecture winner

Default winner order when tradeoffs conflict:

1. truth and safety
2. domain ownership
3. minimal diff
4. maintainability
5. speed

## Backend ownership rules

- prefer `server/v3/modules/*` for new canonical backend behavior
- keep routes thin
- keep business logic in services
- keep table writes and fetch patterns moving toward repositories
- do not let routes talk directly to Supabase unless the local pattern clearly already requires it and the task is intentionally narrow

## System truths

### ParlayOS

- canonical V3 path exists in `server/v3/modules/parlays`
- legacy canonical parlay routes are now cutover-ready with route-scoped kill switches
- if touching canonical parlay flows, preserve V3 ownership and telemetry

### TrustOS

- current trust is score computation over pick history, not yet a canonical ledger
- prefer ledger and projection thinking for new work

### BillingOS

- current canonical path is in `server/v3/modules/billing`
- keep webhook work isolated and idempotent
- never claim production-grade webhook handling without duplicate-event and async-processing discipline

### SocialOS and World Chat

- `followingHubService.ts` is real persisted product logic
- `worldChatService.ts` is still in-memory in the current checkout
- do not describe World Chat as durable or production-grade unless you actually replace that storage path

### NotificationOS

- notifications persist
- push delivery is still incomplete in current code
- separate creation from delivery if you expand this system

### HR / Truth OS

- preserve hot cache, last-good fallback, and degraded-service behavior
- avoid “cleanups” that remove resilience features just because they look complex

## Production-grade direction

When asked to make a backend system 95+:

- prefer durable queues or worker ownership for async work
- prefer canonical write paths and projection read paths
- prefer explicit health, metrics, and rollback hooks
- prefer module-local contracts and route ownership

## Verification defaults

- route or service patch: run `npm run typecheck`
- billing, trust, or parlay canonical work: also run `npm run verify:v3-backend`
- broad backend runtime work: run `npm run typecheck` and `npm run build`
