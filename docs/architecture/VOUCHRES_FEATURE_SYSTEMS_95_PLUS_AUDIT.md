# Vouchres Feature Systems 95+ Audit

Date: July 20, 2026

## Verdict

Vouchres has one premium-grade backend slice already moving into the right
class: ParlayOS. The rest of the machine is mixed.

The strong parts:

- ParlayOS replacement is real, verified, and locally cut over to V3.
- HR / truth systems show real resilience patterns already.
- Billing has a cleaner V3 shape than the legacy path.
- Social hub features are real product surfaces, not mock screens.

The weak parts:

- World Chat is still in-memory in the current checkout.
- Notifications persist, but push delivery is still effectively stubbed.
- Trust is still score math over pick history, not a canonical event ledger.
- SocialOS and AI OS still rely too much on request-path work instead of
  durable event or worker ownership.
- Mid-end / platform durability is not yet premium enough for a 95+ claim
  across the whole product.

## Score Summary

Current system average across the major product systems scored here: `76.4/100`

95+ target average across those same systems: `95.2/100`

## Score Matrix

| System | Current | Target | Verdict |
|---|---:|---:|---|
| ParlayOS | 92 | 96 | Strongest system today |
| TrustOS | 74 | 95 | Good UX concept, weak canonical backend |
| BillingOS | 84 | 95 | Real V3 shape, still too inline around webhook work |
| SocialOS core | 78 | 95 | Real follow/story/DM system, not yet production-premium |
| World Chat | 52 | 95 | Honest MVP, not production-grade in current checkout |
| NotificationOS | 61 | 95 | In-app persistence exists, delivery system is incomplete |
| HR / Truth OS | 90 | 95 | Operationally strong, still wants durable split and workerization |
| AI / Agent OS | 76 | 95 | Feature-rich, still too orchestration-heavy and under-evaluated |
| Mid-end / Platform OS | 81 | 96 | Health and telemetry exist, durable runtime split still missing |

## 1. ParlayOS

Current verdict:

- V3 handlers now own canonical detail, list, save, commit-trust, and
  finalize-trust-lock flows.
- Legacy canonical parlay routes are route-scoped and kill-switch ready.
- Local cutover has already been proven.

Why the score is `92` instead of `96` already:

- grading and settlement still need stronger worker ownership
- trust locking still needs a more canonical downstream proof path
- production rollout is prepared, but not yet claimed as complete here

95+ plan:

- move grading and settlement into durable queue-driven jobs
- keep parlay writes transactional at the database boundary
- add proof projections and reconciliation jobs as first-class backend flows
- finish phased production rollout with monitoring between phases

## 2. TrustOS

Current verdict:

- trust exists and is honest enough to show verified record, recent form,
  transparency, and market preference
- current score logic is still computed from pick history and cached in memory
  rather than coming from a canonical immutable trust ledger

Evidence:

- [trustScoreService.ts](/Users/boydsantos/Desktop/Projects/Vouch/vouchres/server/services/trust/trustScoreService.ts:52)
- [verifiedRecordService.ts](/Users/boydsantos/Desktop/Projects/Vouch/vouchres/server/services/trust/verifiedRecordService.ts:12)

Why the score is `74`:

- no canonical `trust_ledger` event model
- no projection model separating proof from score display
- no durable rebuild path for trust projections

95+ plan:

- add immutable trust events for commit, lock, grade, repair, and revoke
- build projection tables for public proof, profile trust, and historical audit
- drive trust recomputation from queue or worker events, not page reads
- anchor public proof artifacts to one canonical backend source of truth

## 3. BillingOS

Current verdict:

- V3 billing checkout, portal, status, and webhook handlers are cleaner now
- Stripe configuration checks and tier normalization are real
- status reads still happen inline and webhook handling still wants stronger
  asynchronous ownership

Evidence:

- [handlers.ts](/Users/boydsantos/Desktop/Projects/Vouch/vouchres/server/v3/modules/billing/handlers.ts:115)
- [handlers.ts](/Users/boydsantos/Desktop/Projects/Vouch/vouchres/server/v3/modules/billing/handlers.ts:227)

Why the score is `84`:

- webhook work still appears request-path centered
- entitlement sync is not yet clearly queue-backed
- stronger duplicate-event and replay discipline should be explicit end to end

95+ plan:

- create a `billing_webhook_events` inbox table with explicit processing states
- verify Stripe event id plus business object id for duplicate defense
- process subscription sync off the request path with durable consumers
- project entitlements into a stable read model used by app middleware

## 4. SocialOS Core

Current verdict:

- following hub, notes, stories, and DMs are real product surfaces backed by
  Supabase tables
- the current shape is still request-response heavy and not yet realtime-native

Evidence:

- [followingHubService.ts](/Users/boydsantos/Desktop/Projects/Vouch/vouchres/server/services/social/followingHubService.ts:38)
- [followingHubService.ts](/Users/boydsantos/Desktop/Projects/Vouch/vouchres/server/services/social/followingHubService.ts:101)
- [followingHubService.ts](/Users/boydsantos/Desktop/Projects/Vouch/vouchres/server/services/social/followingHubService.ts:179)

Why the score is `78`:

- no strong event fanout model yet
- realtime delivery is not the system backbone
- DM and story updates still look more CRUD than event-stream based

95+ plan:

- add topic-driven realtime broadcast for DM, story, note, and follow events
- build event outbox tables for social fanout and notification hooks
- separate write models from read models for inboxes and feed summaries
- use tighter RLS and topic authorization around realtime channels

## 5. World Chat

Current verdict:

- this is the biggest honesty gap in the current checkout
- World Chat is explicitly in-memory and resets on server restart

Evidence:

- [worldChatService.ts](/Users/boydsantos/Desktop/Projects/Vouch/vouchres/server/services/worldChat/worldChatService.ts:1)
- [worldChatService.ts](/Users/boydsantos/Desktop/Projects/Vouch/vouchres/server/services/worldChat/worldChatService.ts:45)

Why the score is `52`:

- no durable persistence in the current code path
- no realtime backbone
- no moderation or retention workflow
- no safe scale story if traffic rises

95+ plan:

- move messages and chat profiles into dedicated tables
- add realtime topic broadcast for room updates
- add moderation queue, dedupe, and retention rules
- keep server-owned identity resolution through SocialOS profiles

## 6. NotificationOS

Current verdict:

- in-app notifications persist and dedupe keys exist
- preference reads exist
- browser push is currently a no-op in this checkout

Evidence:

- [notificationService.ts](/Users/boydsantos/Desktop/Projects/Vouch/vouchres/server/services/notifications/notificationService.ts:116)
- [notificationService.ts](/Users/boydsantos/Desktop/Projects/Vouch/vouchres/server/services/notifications/notificationService.ts:130)
- [notificationService.ts](/Users/boydsantos/Desktop/Projects/Vouch/vouchres/server/services/notifications/notificationService.ts:151)

Why the score is `61`:

- delivery exists mostly as persisted intent, not real multi-channel delivery
- push sender is not actually configured
- event creation still loops recipients inline

95+ plan:

- split notification creation from notification delivery
- use outbox plus durable queue workers for push, email, and in-app fanout
- add real provider-backed web push dispatch
- move HR scan fanout and parlay-grade fanout out of request-bound loops

## 7. HR / Truth OS

Current verdict:

- this is one of the most production-minded parts of the system already
- there is local cache, in-flight dedupe, redis hot cache, last-good fallback,
  validated indexes, and degraded-service handling

Evidence:

- [hrBoardHub.ts](/Users/boydsantos/Desktop/Projects/Vouch/vouchres/server/services/hubs/hrBoardHub.ts:26)
- [hrBoardHub.ts](/Users/boydsantos/Desktop/Projects/Vouch/vouchres/server/services/hubs/hrBoardHub.ts:160)
- [hrBoardHub.ts](/Users/boydsantos/Desktop/Projects/Vouch/vouchres/server/services/hubs/hrBoardHub.ts:204)

Why the score is `90`:

- the system is resilient, but still too runtime-combined
- ingest, validate, score, and deliver are still closer than they should be
- durable refresh and rebuild ownership can be stronger

95+ plan:

- split ingest, snapshot, validate, score, and delivery into clearer workers
- queue board refresh, repair, and research prewarm work
- preserve last-good and hot-cache patterns, but make rebuild paths explicit
- add stronger pipeline observability by stage

## 8. AI / Agent OS

Current verdict:

- feature depth is real: chat, image, theme, player research, explain-pick,
  parlay edge, capper agents, judges, and central brain services
- quota and rate limiting exist
- the system still feels orchestration-heavy and under-evaluated

Evidence:

- [aiRoutes.ts](/Users/boydsantos/Desktop/Projects/Vouch/vouchres/server/routes/aiRoutes.ts:41)
- [agentRoutes.ts](/Users/boydsantos/Desktop/Projects/Vouch/vouchres/server/routes/agentRoutes.ts:33)

Why the score is `76`:

- too much request-path generation
- not enough eval ledger, versioned prompts, or offline grading of model output
- expensive AI flows should be more isolated from user request latency

95+ plan:

- add prompt/version registry and evaluation tables
- move heavier AI jobs to durable workers
- cache model artifacts and research products more aggressively
- separate interactive AI from batch intelligence generation

## 9. Mid-end / Platform OS

Current verdict:

- the platform is much better than it used to be
- health routes, readiness, route metrics, legacy cutover telemetry, and V3
  module structure are real wins
- the runtime is still not fully split into premium-grade API / worker /
  webhook ownership

Evidence:

- [index.ts](/Users/boydsantos/Desktop/Projects/Vouch/vouchres/server/routes/index.ts:56)
- [index.ts](/Users/boydsantos/Desktop/Projects/Vouch/vouchres/server/routes/index.ts:122)

Why the score is `81`:

- scheduled jobs still lean on cron entrypoints
- durable queue ownership is not the system default yet
- observability is useful but not yet deep enough for every subsystem

95+ plan:

- split runtime ownership into API, worker, and webhook runtimes
- use database-native queues first, then external queue help where needed
- instrument traces, logs, cron runs, and queue outcomes end to end
- document and enforce module-owned contracts per domain

## Research-Backed Upgrade Tools

These are the expensive native-lens upgrades that fit this codebase best:

1. Supabase Queues for durable background jobs before adding more moving parts
2. Explicit Supabase grants plus RLS for every exposed object
3. Supabase Realtime Broadcast for SocialOS, World Chat, DM, and event fanout
4. Vercel Fluid Compute for better Node runtime efficiency on I/O-heavy paths
5. Vercel cron only as a trigger, not as the durable job system itself
6. Upstash QStash for delayed retries, dead-letter handling, dedupe, and fanout
7. Sentry tracing, profiling, and logs initialized early in the process
8. Stripe webhook inbox plus async processing instead of heavier inline work

## Fastest Path To 95+

If the goal is the biggest score gain with the least wasted motion:

1. finish TrustOS replacement
2. replace World Chat with durable SocialOS-backed persistence
3. replace NotificationOS delivery with queue-backed fanout
4. split BillingOS webhook processing into inbox plus worker
5. add queue-backed Mid-end runtime ownership
6. move SocialOS to realtime broadcast plus outbox projections
7. move AI OS heavy work into eval-backed workers

## Final Truth

Vouchres is not one broken system. It is one partly premium system surrounded by
several mid-tier systems and a few MVP leftovers.

The good news is that the upgrade path is very clear now.

The most realistic 95+ destination is:

- ParlayOS stays the anchor
- TrustOS becomes canonical and ledger-driven
- SocialOS becomes event-driven and realtime-backed
- NotificationOS becomes delivery-driven instead of table-driven
- BillingOS becomes inbox-and-worker owned
- HR OS keeps its resilience and gains durable stage ownership
- AI OS gets evals, caching, and worker isolation
- Mid-end platform finally becomes premium enough to support the rest
