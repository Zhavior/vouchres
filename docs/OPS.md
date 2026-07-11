# VouchEdge Operations Runbook

One-page guide for on-call, deploys, recovery, and observability.

## Health endpoints

| URL | Use |
|-----|-----|
| `GET /api/health` | Liveness (Render health check) |
| `GET /api/health/backend` | Full ops report: env checklist, cache stats, route metrics, `productionProof` |
| `GET /api/health/mlb` | MLB upstream probe (503 when `status: down`) |
| `GET /api/health/metrics` | Route latency p95, recent 5xx/slow requests |

Staff UI: **Admin → System Health** tab (same data, formatted).

## Error logging

- **Structured JSON logs:** every API error via `structuredLog` (stdout → Render/Vercel log drain).
- **Sentry (recommended):** set `SENTRY_DSN` (server) and `VITE_SENTRY_DSN` (client).
- **Ops webhook (optional):** set `ALERT_WEBHOOK_URL` to a Slack incoming webhook for critical 5xx, grading failures, and Stripe payment failures.

### Sentry alert rules (dashboard)

1. Create alert: **Issues → New Alert Rule → When event level is error/fatal**
2. Filter: `environment:production`
3. Notify: email + Slack integration
4. Duplicate for **Performance → p95 > 3s** on `/api/mlb/*` routes (optional)

## Deploy status

- **CI:** `.github/workflows/ci.yml` runs typecheck, lint, tests, build, staging soak on every push/PR.
- **Client stale bundle:** users see **Update available** banner when `/build-id.txt` differs from baked build id.
- **Rollback:** revert commit on `main` → Vercel/Render auto-deploys previous artifact (typically < 5 min).

### Rollback drill (staging)

```bash
git revert HEAD --no-edit && git push origin main
# Confirm /api/health/backend status ok and /build-id.txt changed after deploy
BASE_URL=https://your-staging-url npm run staging-soak
```

## Backups & restore

User data lives in **Supabase Postgres**.

| Tier | Backup |
|------|--------|
| Supabase Free | Daily backups (7-day retention) — enable in dashboard |
| Supabase Pro+ | Daily + **Point-in-Time Recovery (PITR)** |

### Restore steps (Supabase PITR)

1. Supabase Dashboard → **Database → Backups → Restore**
2. Pick timestamp **before** the incident
3. Restore to a **new project** first (never overwrite prod in place without a drill)
4. Update `SUPABASE_URL` + keys in hosting env → redeploy
5. Run `npm run staging-soak:strict` against restored backend

### What is NOT in app backups

- In-memory TTL caches (rebuild on boot)
- Upstash Redis last-good snapshots (optional L2 — MLB re-fetches from upstream)

## Incident response

### Severity guide

| Level | Example | Action |
|-------|---------|--------|
| S1 | Auth down, billing webhooks failing, data corruption | Page on-call, consider rollback |
| S2 | MLB upstream degraded, elevated 5xx | Monitor health endpoints, enable last-good (automatic) |
| S3 | Single feature UI error | Sentry triage, hotfix PR |

### First 15 minutes

1. Check `GET /api/health/backend` — read `warnings`, `productionProof`, `dependencies`
2. Check `GET /api/health/mlb` — upstream reachable?
3. Scan Sentry / log drain for `requestId` from user report
4. If deploy-correlated: revert last commit (see Rollback above)
5. If MLB-only: confirm honest degradation (last-good warnings in API meta, no fake lineups)

### Communication template

```
[VouchEdge incident] <short title>
Status: investigating | mitigated | resolved
Impact: <who/what>
Start: <UTC time>
Workaround: <if any>
Next update: <time>
```

## Cron & grading

- Vercel: `/api/cron/parlays/grade-due` (Bearer `CRON_SECRET`)
- Render: `dist/gradeJob.cjs` daily
- Manual staff: Admin → Grading tab or `POST /api/parlays/grade-due` (staff auth)

Grading failures emit Sentry + optional `ALERT_WEBHOOK_URL`.

## Required production env

See `GET /api/health/backend` → `actionItems`. Minimum:

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`
- `STRIPE_WEBHOOK_SECRET` when `STRIPE_SECRET_KEY` is set
- Recommended: `SENTRY_DSN`, `UPSTASH_REDIS_*`, `ALERT_WEBHOOK_URL`
