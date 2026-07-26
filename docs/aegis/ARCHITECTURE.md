# Aegis architecture

## Execution lifecycle

1. The entry point authenticates and establishes the trusted actor.
2. Existing request context supplies the request ID.
3. Aegis creates an execution ID and reuses the request ID as the default
   correlation ID.
4. The versioned operation contract validates input and actor eligibility.
5. The canonical domain handler executes business behavior.
6. The output contract validates the handler result before it reaches a client.
7. Aegis records structured completion or failure telemetry.
8. The API response includes request, execution, correlation, and contract
   metadata while preserving legacy top-level fields.

## Contract model

Each contract declares identity, version, kind, owning domain, input/output
schemas, actor types, policy names, entitlement requirement, idempotency
behavior, side effects, expected events/errors, sensitivity, and audit level.

These declarations are enforceable through TypeScript, Zod, registry checks,
tests, and `verify:aegis`. They do not replace database constraints.

## Error model

Aegis reuses `AppError`. Failures receive an execution ID. The existing global
handler keeps internal 5xx details private while returning the execution ID in
response metadata for support correlation.

## Telemetry model

Aegis emits structured start/completion/failure records. It never logs command
payloads, tokens, payment data, provider responses, or private provenance.

## Event and provenance boundary

Contracts declare current events and provenance obligations. The three migrated
contracts deliberately declare no emitted events because their present audit,
trust-ledger, and proof calls are direct best-effort side effects rather than
atomic outbox publication. Aegis counts supplied provenance but does not claim
durable event publication. Existing domain code remains authoritative until an
atomic outbox migration and worker are implemented.

## Performance

The foundation adds UUID creation, in-memory contract lookup, two Zod boundary
checks, and structured logs. It adds no database round trips. Durable execution,
idempotency, and outbox writes require separate measurement before rollout.
