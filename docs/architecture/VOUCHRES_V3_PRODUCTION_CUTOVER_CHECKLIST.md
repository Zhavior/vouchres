# Vouchres V3 Production Cutover Checklist

Use this during the real production rollout.

Date prepared: July 20, 2026

## Before touching production

1. Confirm the repo is on the intended release commit.
2. Confirm these checks passed on that release:
   - `npm run typecheck`
   - `npm run build`
   - `npm run verify:v3-backend`
3. Keep the rollback rule visible:
   - if a phase causes trouble, remove only the newest label and redeploy
4. Keep monitoring open:
   - `/api/health/metrics`
   - field: `legacyRoutes`

## Phase 1

Goal:
Retire legacy parlay detail reads first.

Production env value:

```env
DISABLE_LEGACY_CANONICAL_PARLAY_ROUTE_LABELS=legacy.parlay.detail
```

What should still work:
- `GET /api/v3/parlays/:id`
- all other legacy canonical routes until their own phase

Success signal:
- `legacy.parlay.detail` stops showing expected live traffic in `legacyRoutes`
- V3 detail route keeps serving normally

Rollback:
- remove `legacy.parlay.detail`

## Phase 2

Goal:
Retire legacy parlay list reads.

Production env value:

```env
DISABLE_LEGACY_CANONICAL_PARLAY_ROUTE_LABELS=legacy.parlay.detail,legacy.parlay.list
```

What should still work:
- `GET /api/v3/me/parlays`
- legacy trust and save routes until their own phase

Success signal:
- `legacy.parlay.list` drops out
- V3 list route stays healthy

Rollback:
- go back to Phase 1 value

## Phase 3

Goal:
Retire legacy trust commit writes.

Production env value:

```env
DISABLE_LEGACY_CANONICAL_PARLAY_ROUTE_LABELS=legacy.parlay.detail,legacy.parlay.list,legacy.parlay.commit_trust
```

What should still work:
- `POST /api/v3/parlays/:id/commit-trust`
- legacy finalize and save routes until their own phase

Success signal:
- `legacy.parlay.commit_trust` drops out
- V3 commit route stays healthy

Rollback:
- go back to Phase 2 value

## Phase 4

Goal:
Retire legacy trust finalize writes.

Production env value:

```env
DISABLE_LEGACY_CANONICAL_PARLAY_ROUTE_LABELS=legacy.parlay.detail,legacy.parlay.list,legacy.parlay.commit_trust,legacy.parlay.finalize_trust_lock
```

What should still work:
- `POST /api/v3/parlays/:id/finalize-trust-lock`
- legacy save route until its own phase

Success signal:
- `legacy.parlay.finalize_trust_lock` drops out
- V3 finalize route stays healthy

Rollback:
- go back to Phase 3 value

## Phase 5

Goal:
Retire legacy save writes.

Production env value:

```env
DISABLE_LEGACY_CANONICAL_PARLAY_ROUTE_LABELS=legacy.parlay.detail,legacy.parlay.list,legacy.parlay.commit_trust,legacy.parlay.finalize_trust_lock,legacy.parlay.save
```

What should still work:
- `POST /api/v3/parlays/save`

Success signal:
- `legacy.parlay.save` drops out
- V3 save route stays healthy

Rollback:
- go back to Phase 4 value

## Rules during rollout

1. Change one phase only.
2. Redeploy fully after each env change.
3. Watch metrics before moving to the next phase.
4. If signals are mixed, stop and hold the current phase.
5. Do not use the global kill switch for normal rollout.

## Emergency rule

Only use this if you intentionally want all 5 canonical legacy routes shut off at once:

```env
DISABLE_LEGACY_CANONICAL_PARLAY_ROUTES=true
```
