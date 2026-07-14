# Production hosting & cron (single host)

VouchEdge must run **one** production API host and **one** cron scheduler.
Dual scheduling (Vercel Cron + Render Cron hitting the same grade jobs) can
double-fire without Redis locks — and even with locks, competing hosts are
operational noise.

## Canonical production model

| Role | Owner |
| --- | --- |
| Always-on API | **Render** (`render.yaml` → `vouchedge-api`) |
| Grade / delete cron | **Render** cron services (`vouchedge-grader`, `vouchedge-deleter`) |
| Static SPA / CDN (optional) | Vercel **frontend-only** — no API crons |

`vercel.json` ships with `"crons": []` so Vercel cannot schedule grade/live-HR
jobs while Render crons are enabled.

## Hard requirements (prod boot fails closed)

Set on the Render web service (and grader where noted):

- `SUPABASE_URL` (or `VITE_SUPABASE_URL`) + `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET` (Bearer on HTTP cron routes; fail-closed if missing)
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (rate limits, HR cache, grade locks)
- `SENTRY_DSN`

Optional when billing is on: `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`.

`TRUST_PROXY` defaults to `1` on Render (see `render.yaml`). Rate limits key off
Express `req.ip` (trusted hop), not the leftmost `X-Forwarded-For`.

## Ops telemetry

- Public: `GET /api/health` (liveness), `GET /api/health/ready` (readiness)
- Staff-only: `GET /api/health/backend`, `GET /api/health/metrics`

## If you must use Vercel as the API host instead

1. Disable / remove Render cron services so only one scheduler runs.
2. Restore the desired schedule entries under `vercel.json` → `crons`.
3. Keep Upstash Redis required so distributed grade locks still coalesce.
4. Do **not** enable both Vercel crons and Render grade jobs at the same time.
