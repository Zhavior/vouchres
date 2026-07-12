# VouchEdge Central Brain

## Non-negotiable boundary

The central brain is a versioned decision platform, not an LLM that invents picks. Deterministic sport engines own numeric scores. AI may summarize evidence, compare decisions, and identify missing data. AI must never change a score, create a lineup, fabricate odds, or upgrade projected evidence to verified.

## Runtime path

1. Sport data gateways collect sourced observations.
2. Sport adapters produce point-in-time evidence using existing engines.
3. Runtime schemas reject malformed scores, confidence, ranks, evidence, or metadata.
4. The central agent publishes one immutable, versioned snapshot.
5. Page read models select from that snapshot; pages do not recalculate the math.
6. Settled outcomes feed offline calibration and regression evaluation.

## Adoption gates

### Use now

- TypeScript adapters and Zod runtime contracts.
- Existing Upstash cache, distributed locks, request IDs, structured logs, and Sentry.
- Existing MLB shared daily report and HR engines as the first authoritative adapter.
- Stable endpoint: `GET /api/intelligence/brain/mlb/daily`.

### Add after replay storage exists

- OpenTelemetry spans for ingest, adapter, scoring, trust gate, cache, and narration stages.
- Postgres tables for immutable input snapshots, decisions, engine versions, and settled outcomes.
- MLflow for offline experiment, model, prompt, and evaluation versioning.
- Evidently for missing-feature, input-distribution, prediction, and calibration drift.

### Defer until scale justifies it

- Feast: adopt when historical training and online serving require point-in-time-correct shared features across several models.
- Temporal: adopt when refresh, settlement, retraining, or backfill workflows require durable multi-step recovery beyond existing cron jobs and locks.

### Reject

- LLM-generated numeric features or final scores.
- A single universal formula shared across different sports or markets.
- Page-specific model calls and prompt copies.
- Silent fallbacks that replace missing evidence with invented neutral values.
- Migrating every page in one release.

## Migration order

1. Home Run Intelligence reads the MLB central snapshot without changing current visuals.
2. Today and Daily Players consume matchup and availability projections from the same snapshot.
3. ParlayOS consumes immutable decision IDs and engine versions, never copied display text.
4. Profile and Results join settled outcomes back to the originating decision version.
5. NBA and NFL remain unavailable until each has sourced data, market-specific math, calibration tests, and a registered adapter.
