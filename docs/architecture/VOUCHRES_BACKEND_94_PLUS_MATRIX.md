# Vouchres backend 94+ matrix

## Goal

Push every major backend area above `94/100` without rebuilding Vouchres into
an unnecessary microservice system.

This matrix extends
[`VOUCHRES_BACKEND_ARCHITECTURE_V2.md`](./VOUCHRES_BACKEND_ARCHITECTURE_V2.md)
with stack-specific upgrades drawn from current official docs for Supabase,
Vercel, Upstash, Sentry, and PostgreSQL.

## Summary

The fastest path to `94+` is:

1. split runtimes
2. move durable async work into Postgres-native queues or a worker path
3. push more transactional business rules into Postgres functions
4. improve repository discipline
5. make OpenAPI and schema ownership stricter
6. harden connection pooling and observability

## Score matrix

| Area | Current | 94+ move | Target |
|---|---:|---|---:|
| Runtime structure | 68 | API + worker + optional webhook runtime split | 95 |
| Route architecture | 74 | Module-owned routes and thinner composition layer | 95 |
| Domain separation | 76 | `modules/*` ownership with route/service/repository boundaries | 95 |
| Persistence layer | 63 | Repositories per domain, fewer direct Supabase calls | 95 |
| Database transactional design | 82 | More RPC/functions for atomic business writes | 95 |
| Auth and entitlements | 84 | Narrow service-role access, stricter auth platform layer, explicit grants policy | 95 |
| Sports data gateway | 88 | Normalize all provider outputs into read models | 95 |
| HR board pipeline | 89 | Split ingest, snapshot, validation, score, delivery | 95 |
| Grading and settlement | 83 | Worker-owned grading + atomic parlay settlement | 96 |
| Trust and proof | 80 | Canonical trust ledger and proof projection path | 95 |
| Billing and webhooks | 82 | Isolated webhook/runtime + stronger entitlement sync | 95 |
| Observability and health | 87 | Job-level tracing, domain tags, release discipline | 95 |
| API contracts | 86 | Module-local schema ownership and stricter OpenAPI use | 96 |
| Background job durability | 71 | Supabase Queues or worker-backed durable jobs | 96 |
| Cache / lock strategy | 84 | Clear cache tiers and lock ownership | 95 |
| Social / notifications | 79 | Projection-driven updates + Realtime fanout discipline | 95 |
| AI backend architecture | 77 | Shrink orchestration surface, add evals, isolate AI domain | 95 |
| Operability for scale | 72 | pooling, queueing, job isolation, better deploy topology | 95 |

## High-leverage upgrades by area

## 1. Runtime structure

### Current problem

`server.ts` still acts like the universal host process.

### 94+ upgrade

Create three clear entrypoints:

- `server/api/bootstrap.ts`
- `server/worker/bootstrap.ts`
- `server/webhooks/stripe.ts`

Why this is stronger:

- cleaner fault isolation
- smaller deploy bundles
- less accidental coupling between user traffic and background work

## 2. Persistence layer

### Current problem

The service count is far higher than the repository count.

### 94+ upgrade

Create repositories for:

- `identity`
- `billing`
- `picks`
- `parlays`
- `grading`
- `trust`
- `social`
- `notifications`

Hard rule:

- routes do not talk to Supabase
- services do not issue raw table mutations unless they are inside a repository

## 3. Durable async work

### Current problem

Grading is careful, but still too request-process shaped.

### 94+ upgrade

Use **Supabase Queues** with the `pgmq` extension for durable background jobs
before adding another queue platform. Supabase now documents Queues as a
Postgres-native durable message system with guaranteed delivery and `pgmq`
supports visibility timeouts and explicit removal/archive behavior.

Suggested queue names:

- `grade-pending-picks`
- `refresh-hr-board`
- `rebuild-trust-rollups`
- `reconcile-billing`
- `repair-legacy-picks`

Why this is better than jumping straight to external queue infrastructure:

- stays close to your system of record
- simpler local debugging
- easier migration from current cron and script flows

### When to add QStash

Use Upstash QStash only for:

- delayed retries over long windows
- dead-letter queue needs
- external callback workflows
- fanout beyond the database-owned job system

## 4. Database transactional design

### Current problem

Some critical flows still rely too much on app-layer sequencing.

### 94+ upgrade

Push these into database functions or tighter transactional repository methods:

- create parlay with legs
- settle parlay parent and child legs together
- write grade + grading log + trust rollup together
- lock a pick for public share and proof generation together
- apply billing entitlement changes and subscription snapshots together

Why this gets you over 94:

- fewer partial writes
- better retry behavior
- clearer idempotency surface

## 5. Connection management

### Current problem

As Vouchres grows, pooled connection discipline will matter more.

### 94+ upgrade

Adopt explicit Supabase pool strategy:

- request/worker code should prefer Supavisor transaction-mode safe patterns for
  bursty connection usage
- use direct or session mode only where the code truly requires it
- document which clients use which path

Add:

- pool mode notes in `docs/architecture`
- connection budget review as part of production readiness

## 6. Webhooks and scheduled work

### Current problem

Webhook logic is correctly handled in Express today, but runtime ownership is
still broader than ideal.

### 94+ upgrade

Options:

- keep Stripe webhook in its own isolated Node handler
- or move it to a Supabase Edge Function if that fits your operational model

For scheduled work:

- if you stay Vercel-first, keep cron as a bounded trigger only
- if you lean more into Supabase, `pg_cron` + `pg_net` can invoke Edge
  Functions on schedule and secrets can live in Supabase Vault

This is especially useful for:

- nightly report generation
- trust rollup rebuilds
- soft reconciliation tasks

## 7. Auth and security

### Current problem

Auth foundation is good, but privileged DB access needs stronger centralization.

### 94+ upgrade

- keep browser-facing data behind RLS
- audit every client-accessible table for policy and performance
- limit service-role usage to platform DB helpers and repositories
- document ownership of privileged writes clearly

Optional later:

- evaluate `@supabase/server` once the package is more mature for your needs

### New research that changes the plan

Supabase changed table exposure defaults and published a rollout for existing
projects. New tables in `public` are no longer meant to be treated as
automatically reachable by the Data API. Existing projects are scheduled to be
enforced on `October 30, 2026`.

That means a `95+` Vouchres backend should adopt this rule now:

- every Data API-facing table migration includes `GRANT`
- every exposed table enables RLS
- every exposed table defines policies in the same migration
- Security Advisor becomes part of backend acceptance, not an occasional check

This is a quiet but high-impact upgrade because it removes a whole class of
"table exists but app cannot reach it" failures and avoids accidental exposure.

## 7a. Database API exposure discipline

### Current problem

The repo has enough surface area that future table creation mistakes are
realistic, especially with AI-assisted coding and fast feature work.

### 95+ upgrade

Treat database exposure as an explicit contract:

- `GRANT` statements live beside table creation
- RLS enablement lives in the same migration
- policies live in the same migration
- public-vs-private schema intent is written down per table family

This should become a checklist item for:

- new picks tables
- trust/proof tables
- social tables
- AI evaluation tables
- job or queue metadata tables

## 8. API contracts

### Current problem

OpenAPI is real, but it can do more heavy lifting.

### 94+ upgrade

Restructure contract ownership:

- each module owns its request and response schemas
- each module registers its own OpenAPI paths
- generated spec becomes CI-visible and diff-reviewable

Add:

- client contract generation or shared schema adapters
- explicit API versioning policy for public-facing paths

### New research that changes the plan

The strongest extra jump here is not only TypeScript schemas in app code. It is
also database-level payload validation and database tests.

Add two layers:

- `pg_jsonschema` for high-risk `jsonb` payload columns
- `pgTAP` tests for schema shape, indexes, functions, and RLS expectations

This matters for Vouchres because several backend paths rely on structured
payloads that should not be "best effort" only.

Suggested uses for `pg_jsonschema`:

- AI output payloads
- webhook event snapshots
- trust proof metadata
- normalized sports-provider payload caches

Suggested `pgTAP` coverage:

- expected RLS policies exist on exposed tables
- critical indexes exist
- critical functions exist
- queue tables and job metadata tables are present and protected

## 9. Observability

### Current problem

Health is already good, but background and domain traces need stronger shape.

### 94+ upgrade

Standardize log and trace fields:

- `domain`
- `operation`
- `request_id`
- `job_id`
- `pick_id`
- `parlay_id`
- `provider`
- `user_id` where appropriate

Add:

- release tagging
- worker-specific dashboards
- upstream provider failure breakdowns
- queue lag visibility

## 10. AI backend architecture

### Current problem

There is a lot of AI surface area and it risks becoming expensive or hard to
reason about.

### 94+ upgrade

- isolate AI into its own `modules/ai`
- separate generation, evaluation, prompt assembly, and persistence
- do not let AI endpoints reach broadly across unrelated domains
- add evals for user-visible prompt paths using `promptfoo` from your local OSS library
- add trace capture for money-path or trust-path AI actions if they become core

## 11. Social and notifications

### Current problem

These features are real, but still share too much backend pressure with other domains.

### 94+ upgrade

- make feed and notification writes canonical in DB
- use Realtime for fanout only
- treat social read models as projections, not live join-heavy request assembly

Add:

- outbox-style notification records before delivery fanout
- retryable delivery workers for push/email/in-app sync
- Realtime channel ownership by projection, not by ad hoc route logic

## 12. Sports and HR systems

### Current problem

This is already one of the strongest parts of the backend.

### 94+ upgrade

Push the remaining complexity into clearer internal layers:

- ingest
- snapshot
- validation
- scoring
- delivery

Add explicit snapshot tables or cached projections for:

- player truth state
- lineup truth state
- game truth state
- live parlay progress

## Best stack-specific upgrade choices

If we want the highest score per unit of effort, the best next technical moves
are:

1. Supabase Queues with `pgmq` for durable jobs
2. More database functions/RPC for atomic writes
3. Explicit grants + RLS + policy discipline for all exposed tables
4. Supavisor-aware connection strategy
5. Module-local OpenAPI ownership
6. `pgTAP` and database-advisor checks in backend acceptance
7. `pg_jsonschema` for risky `jsonb` payload columns
8. Worker runtime split
9. Realtime as fanout, not write-path replacement
10. Optional QStash only where delay/retry/DLQ is truly needed

## Version-aware notes from the current repo

These are worth knowing before we overreact:

- the repo is already on TypeScript `5.8.2`, so the announced future
  `supabase-js` TypeScript `5.0+` requirement is not a blocker here
- the repo already uses `@supabase/supabase-js` `2.110.2`, so the bigger need is
  architecture discipline around how it is used, not emergency package churn
- this means the real score gains come from backend shape, database contracts,
  and job durability, not dependency theater

## What not to do

Avoid these if the goal is `94+` without self-sabotage:

- splitting into many services too early
- adding Kafka or a heavy event bus
- moving all jobs to edge functions blindly
- using triggers for huge hidden workflows
- keeping app-layer transactional writes where Postgres should own them

## First four PRs to get there

1. Runtime split PR
   - create `api`, `worker`, and optional `webhook` entrypoints

2. Repository discipline PR
   - add domain repositories and stop route-to-Supabase direct access

3. Durable jobs PR
   - add job table or Supabase Queues `pgmq` path and move grading onto worker ownership

4. Transaction hardening PR
   - convert critical parlay, grading, proof, and entitlement flows to database-owned transactions

5. Database contract PR
   - add explicit `GRANT` discipline, RLS review, `pgTAP` coverage, and
     `pg_jsonschema` checks for high-risk payload tables

## How to use this document

Use this as the scoring and execution map after approving the v2 architecture.

If you want to act on it immediately, the next deliverable should be a phase-by-
phase implementation plan with:

- exact file moves
- queue schema
- module ownership map
- PR sequence
- verification commands per phase
