# Migration plan

## Next slice: durable trust finalization

The next highest-value work is making proof, audit, trust-event, and notification
requests recoverable after the pick has been locked.

Proposed sequence:

1. Design a private, service-role-only Aegis idempotency/outbox migration after
   reconciling local and remote migration history.
2. Make trust lock state change and outbox insertion one database transaction.
3. Drain proof and notification requests through the existing worker runtime
   with bounded attempts, exponential backoff, and backlog metrics.
4. Add worker replay, duplicate delivery, crash, and graceful-shutdown tests.
5. Wrap the canonical grading command without moving settlement rules into Aegis.

## Cutover criteria

- Same-key/same-input replay returns the prior result.
- Same-key/different-input returns a stable conflict.
- Concurrent duplicates produce one domain mutation and one outbox fact.
- Worker crash/restart processes the fact once from the consumer's perspective.
- Proof and notification failure never rolls back certified grading.
- Legacy and V3 response compatibility tests pass.
- Backlog, failure count, and oldest-pending age are observable.

## Rollback

Keep Aegis at the V3 entry-point adapter. A feature flag may return an operation
to the existing canonical handler path because domain services and schemas are
not moved. Database additions must be additive until shadow/replay evidence is
accepted.

## Legacy removal

Remove a legacy writer only after route telemetry shows no required production
traffic, compatibility fixtures pass, rollback has remained unused through the
observation window, and the canonical ownership verifier reports one writer.
