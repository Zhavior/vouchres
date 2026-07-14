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

> **Ops note:** Repo homepage `https://vouchres.vercel.app` currently still
> boots the Express API via the Vercel function. Production fail-closed will
> refuse requests until `SENTRY_DSN` (and other required secrets) are set on
> that project — or until traffic moves to Render `vouchedge-api`. See
> `docs/DEPLOY_CHECKLIST.md`.

## Ship checklist

See **[DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)** for the ordered ship list
(Render env, cron services, Supabase URLs, post-deploy smoke).

Paste-ready env keys: **[RENDER_ENV_TEMPLATE.env](./RENDER_ENV_TEMPLATE.env)**
(fill secrets in the Render dashboard — never commit real values).

Automated probes:

```bash
BASE_URL=https://<api-host> npm run production-smoke
BASE_URL=http://127.0.0.1:3010 npm run production-smoke -- --local
```

## Hard requirements (prod boot fails closed)

Set on the Render web service (and grader where noted):

- `SUPABASE_URL` (or `VITE_SUPABASE_URL`) + `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET` (Bearer on HTTP cron routes; fail-closed if missing)
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (rate limits, HR cache, grade locks)
- `SENTRY_DSN`

Optional when billing is on: `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`.

`TRUST_PROXY` defaults to `1` on Render (see `render.yaml`). Rate limits key off
Express `req.ip` (trusted hop), not the leftmost `X-Forwarded-For`.

## Step 5 — Supabase auth URLs (required before login works in prod)

Production email confirm, magic links, and password reset all redirect through
`/auth/callback` on the SPA. Supabase must allow those origins.

### Dashboard (manual)

Supabase → **Authentication** → **URL Configuration**:

| Field | Value |
| --- | --- |
| Site URL | `https://vouchedge.app` (or your `FRONTEND_URL`) |
| Redirect URLs | `https://vouchedge.app/**`, `https://www.vouchedge.app/**`, `http://localhost:3000/**`, `https://*.vercel.app/**` |

### CLI (recommended)

```bash
# Dry-run — prints exact PATCH body + Vite env mirror checklist
npm run configure:supabase-auth-urls

# Apply production Site URL (force --site-url so .env.local localhost cannot win)
SUPABASE_ACCESS_TOKEN=<token> npm run configure:supabase-auth-urls -- \
  --apply --site-url=https://vouchedge.app

# Verify without writing
SUPABASE_ACCESS_TOKEN=<token> npm run configure:supabase-auth-urls -- \
  --verify --site-url=https://vouchedge.app
```

Resolves `SUPABASE_PROJECT_REF` from `SUPABASE_URL` when unset.
`--apply` / `--verify` refuse localhost Site URLs unless you pass `--allow-localhost`.
Shell exports beat `.env` / `.env.local` (dotenv does not clobber existing env).

### Mirror on Vercel (frontend build)

Set the same Supabase project on the Vercel SPA:

- `VITE_SUPABASE_URL` = project URL
- `VITE_SUPABASE_ANON_KEY` = anon public key

Render API only needs server keys (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).

### Smoke test after apply

1. Sign up on production → confirm email → lands on `/auth/callback` → redirects to `/today`
2. Magic link sign-in → same callback path
3. `GET /api/auth/username-check?username=probe` returns 200/400/500 (not CORS-blocked from SPA)

## Ops telemetry

- Public: `GET /api/health` (liveness), `GET /api/health/ready` (readiness)
- Staff-only: `GET /api/health/backend`, `GET /api/health/metrics`

## If you must use Vercel as the API host instead

1. Disable / remove Render cron services so only one scheduler runs.
2. Restore the desired schedule entries under `vercel.json` → `crons`.
3. Keep Upstash Redis required so distributed grade locks still coalesce.
4. Do **not** enable both Vercel crons and Render grade jobs at the same time.
