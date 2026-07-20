# Vouchres V3 Production Rollout

This is the production rollout path for the parlay backend replacement that was proven locally on July 20, 2026.

## What is already true

- All 5 canonical legacy parlay routes have route-scoped cutoffs.
- The V3 replacement routes are mounted and smoke-tested.
- Deprecation headers and telemetry are already wired.
- Local proof passed for all 5 route cutoffs.
- `npm run typecheck` passed.
- `npm run build` passed.

## Production flags

Route-scoped cutoff flag:

```env
DISABLE_LEGACY_CANONICAL_PARLAY_ROUTE_LABELS=
```

Global kill switch:

```env
DISABLE_LEGACY_CANONICAL_PARLAY_ROUTES=true
```

Use the route-scoped flag for normal rollout. Keep the global switch for emergencies only.

## Rollout order

1. `legacy.parlay.detail`
2. `legacy.parlay.list`
3. `legacy.parlay.commit_trust`
4. `legacy.parlay.finalize_trust_lock`
5. `legacy.parlay.save`

## Phase values

Phase 1

```env
DISABLE_LEGACY_CANONICAL_PARLAY_ROUTE_LABELS=legacy.parlay.detail
```

Phase 2

```env
DISABLE_LEGACY_CANONICAL_PARLAY_ROUTE_LABELS=legacy.parlay.detail,legacy.parlay.list
```

Phase 3

```env
DISABLE_LEGACY_CANONICAL_PARLAY_ROUTE_LABELS=legacy.parlay.detail,legacy.parlay.list,legacy.parlay.commit_trust
```

Phase 4

```env
DISABLE_LEGACY_CANONICAL_PARLAY_ROUTE_LABELS=legacy.parlay.detail,legacy.parlay.list,legacy.parlay.commit_trust,legacy.parlay.finalize_trust_lock
```

Phase 5

```env
DISABLE_LEGACY_CANONICAL_PARLAY_ROUTE_LABELS=legacy.parlay.detail,legacy.parlay.list,legacy.parlay.commit_trust,legacy.parlay.finalize_trust_lock,legacy.parlay.save
```

## What to watch

- Metrics endpoint: `/api/health/metrics`
- Field: `legacyRoutes`
- Success looks like this:
  retired legacy route traffic drops out
  neighboring legacy routes still show expected auth-gated or live behavior until their own phase
  V3 successor routes keep answering normally

## Checks before each production phase

- `npm run typecheck`
- `npm run build`
- `npm run verify:v3-backend`
- Matching cutoff canary for the phase being retired

## Rollback

- Small rollback:
  remove only the newest label from `DISABLE_LEGACY_CANONICAL_PARLAY_ROUTE_LABELS`
- Full rollback:
  remove `DISABLE_LEGACY_CANONICAL_PARLAY_ROUTE_LABELS`
- Emergency rollback:
  do not enable `DISABLE_LEGACY_CANONICAL_PARLAY_ROUTES=true` unless you intentionally want all 5 canonical legacy routes gone

## Notes

- Do not store full env snapshots in backups.
- Keep the pre-cutover backup and the post-local-cutover backup together.
- Production rollout should happen one phase at a time, with monitoring between phases.
