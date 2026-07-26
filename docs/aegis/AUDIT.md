# Backend audit

## Entry points

- Main Express API: `server.ts` → `server/api/bootstrap.ts` → `server/routes/index.ts`.
- V3 runtime: `server/v3/bootstrap.ts` → `server/v3/app.ts` → `server/v3/routes/index.ts`.
- Vercel adapter: `api/index.ts`, loading the bundled main Express application.
- Worker runtime: `server/worker/bootstrap.ts` starts live HR, notification,
  Stripe webhook, and social outbox workers with explicit stop handles.
- Cron: `server/cron/dailyGradeJob.ts`, `dailyDeleteJob.ts`, and
  `liveHrNotificationLoop.ts`, plus authenticated cron routes.
- Stripe webhooks: raw-body middleware is isolated before JSON parsing in both
  main and V3 bootstraps.
- Verification/CLI: focused scripts under `scripts/`, including V3, parlay
  cutover, billing, grading, trust, and production smoke checks.

## Reusable infrastructure

- Server-owned request IDs: `server/middleware/requestContext.ts`.
- Route duration metrics and structured JSON logging: `routeTiming.ts`,
  `routeMetrics.ts`, and `structuredLog.ts`.
- Stable errors and compatibility envelopes: `AppError`, `apiErrorHandler`, and
  `apiResponse.ts`.
- Runtime contracts: Zod middleware and module-local schemas.
- Authentication and staff/legal gates: trusted Supabase token verification,
  server-loaded profiles, and fail-closed middleware.
- Canonical V3 parlay services and repositories.
- Atomic database RPCs for parlay creation and settlement.
- Existing durability patterns: Stripe webhook inbox, social outbox, audit logs,
  proof anchors, distributed locks, and worker lifecycle management.

## Ownership map

- Parlay save and identity: Parlay domain, `parlayCreationService`.
- Parlay trust commit: Parlay domain, `userParlayService`.
- Trust lock and proof request: Trust domain coordinated through
  `userParlayService`, proof service, and trust repository.
- Leg and parlay resolution: Resolution domain, `gradingService` and sport graders.
- Proof reads: Trust domain, `proofRoutes` and `parlayProofService`.
- Billing and entitlements: V3 billing module plus Stripe webhook worker.
- Notifications: notification service/repository plus notification worker.
- Sports ingestion and HR Board: MLB services and resilience cache pipeline.
- AI and Central Brain: intelligence/brain services and agent routes.

The machine-readable first-slice registry is `server/aegis/ownership.ts`.

## Current risks

1. Parlay creation only has durable duplicate protection when `clientRef` is
   present and the atomic RPC migration exists.
2. The compatibility save fallback writes parent then legs and compensates with
   delete on failure; it is not a database transaction.
3. Trust commit updates the pick before best-effort audit and trust-event writes.
   A process failure can leave supporting evidence incomplete.
4. Trust finalization calculates the proof, starts OTS anchoring, writes audit,
   and writes a trust event in separate steps. Several failures are logged and
   tolerated without a durable retry record.
5. Existing event-like records use domain-specific tables and shapes. There is
   no shared versioned outbox for parlay/trust events.
6. Legacy and V3 entry points still coexist. Existing route-scoped cutover
   telemetry and kill switches must remain until traffic proves removal safe.
7. Some older migrations use `auth.role()` and public-schema privileged
   functions. These require a separate migration-security review; this phase
   does not rewrite historical migrations.

## First slice decision

Aegis wraps the canonical save, commit, and finalize handlers used by V3 and
approved compatibility adapters because they are high-value writes. It does not
move domain logic or add a new database table before durable idempotency and
outbox semantics are designed against the existing Supabase migrations.
