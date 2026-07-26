# Aegis

Aegis is VouchEdge's contract-driven backend execution boundary. It governs how
important commands are identified, validated, authorized, correlated, measured,
and surfaced without taking business rules away from their canonical domains.

The first implemented slice covers parlay save, trust commit, and trust lock
finalization through the canonical handlers used by V3 routes and approved
compatibility adapters. Existing parlay, TrustOS, proof, and grading services
remain the domain owners.

## Current status

- Foundation: implemented in `server/aegis`.
- Canonical parlay adapters: implemented in `server/v3/modules/parlays`.
- Durable generic idempotency: not implemented; the save command currently uses
  the existing `picks(user_id, client_ref)` protection.
- Durable Aegis event outbox: not implemented; existing domain event and audit
  paths remain in place.
- Database migration: none in this phase. Aegis reuses existing tables and RPCs.

Run `npm run verify:aegis` to validate the structured contract and ownership
registries.

## Boundary

Aegis owns execution lifecycle concerns. Domain services own business truth.
Aegis does not grade picks, calculate trust, decide entitlements, generate AI
reasoning, or replace the Trust Ledger.
