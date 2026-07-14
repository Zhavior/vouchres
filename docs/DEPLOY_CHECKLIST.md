# Production deploy checklist

Ordered ship checklist for VouchEdge. Code-side items are automated; operator items need Render / Supabase / Vercel dashboards.

Canonical hosting model: **Render API + Render cron**, Vercel frontend-only (`vercel.json` → `"crons": []`). See `docs/PRODUCTION_HOSTING.md`.

## Checklist

### Code merge (repo)

- [x] P0–P4 hardening on `main` (#79–#84)
- [x] CI green baseline (#82)
- [x] Staging soak parlay auth gates (#85)
- [x] Supabase auth URLs + `/auth/callback` + deploy checklist (#86)

### Render — `vouchedge-api` (required env)

Boot **fails closed** without these:

- [ ] `NODE_ENV=production`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`
- [ ] `CRON_SECRET` (long random; `openssl rand -hex 32`)
- [ ] `SENTRY_DSN`
- [ ] `TRUST_PROXY=1` (already in `render.yaml`)
- [ ] `FRONTEND_URL` (e.g. `https://vouchedge.app`)
- [ ] `CORS_ALLOWED_ORIGINS` (e.g. `https://vouchedge.app,https://www.vouchedge.app`)

Optional product / billing:

- [ ] `GEMINI_API_KEY` (+ `GEMINI_MODEL`)
- [ ] `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (webhook required if secret set)
- [ ] `STRIPE_PRO_MONTHLY_PRICE_ID` / `STRIPE_PRO_YEARLY_PRICE_ID` / creator price IDs
- [ ] `BLOCKED_JURISDICTIONS` (comma-separated; empty = no blocklist)

### Render — cron services

**`vouchedge-grader`**

- [ ] `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`

**`vouchedge-deleter`**

- [ ] `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`

### Vercel (SPA, if split from Render)

- [x] `vercel.json` crons remain `[]` (verified by `production-smoke --local` + CI)
- [ ] `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_API_BASE_URL` = Render API origin (or leave empty only if same-origin)
- [ ] `VITE_SENTRY_DSN` (recommended)
- [ ] If Vercel still hosts `/api`: also set server `SENTRY_DSN` + other fail-closed keys (see live finding below)

### Supabase auth URLs (step 5)

- [x] Dry-run: `npm run configure:supabase-auth-urls` (ships in repo; CI-independent)
- [ ] Apply: `SUPABASE_ACCESS_TOKEN=… npm run configure:supabase-auth-urls -- --apply`
- [ ] Verify: `… -- --verify`
- [ ] Dashboard confirm: Site URL = `https://vouchedge.app`

### Post-deploy smoke

```bash
# Against local built server (CI-style)
BASE_URL=http://127.0.0.1:3010 npm run production-smoke -- --local

# Against staging/production
BASE_URL=https://<api-host> npm run production-smoke
BASE_URL=https://<api-host> CRON_SECRET=<secret> STAFF_ACCESS_TOKEN=<jwt> npm run production-smoke
```

Expected:

- [ ] `GET /api/health` → 200
- [ ] `GET /api/health/backend` → 401 without auth
- [ ] `POST /api/parlays/grade` → 401
- [ ] `POST /api/parlays/live-progress` → 401
- [ ] Cron grade-due → 401 without secret; authorized with `CRON_SECRET`
- [ ] Staff `/api/health/backend` → `productionProof.envReady === true`

Also:

```bash
BASE_URL=https://<api-host> npm run staging-soak:strict
```

### Manual soak (once on staging)

- [ ] Stats API kill-switch — HR/lineup stay honest (warnings or 503; never fake confirmed)
- [ ] Multi-instance — ≥2 API instances + Upstash; shared rate limits / HR cache

## Operator note

This cloud agent **cannot** set Render / Supabase / Vercel secrets from this
environment (no dashboard tokens available).

### Live finding (2026-07-14)

`https://vouchres.vercel.app` (repo homepage) serves the API today and returns:

```json
{"error":"vercel_api_boot_failed","message":"Missing required production config: SENTRY_DSN."}
```

Fail-closed boot is working. Until `SENTRY_DSN` (and any other required secrets)
are set on the API host, post-deploy smoke cannot pass against that URL.

**Preferred fix (canonical):** stand up Render `vouchedge-api` with
`docs/RENDER_ENV_TEMPLATE.env`, point `VITE_API_BASE_URL` / homepage at Render,
keep Vercel frontend-only (`vercel.json` crons already `[]`).

**Alternate:** set the same required env on the Vercel project that hosts `/api`,
then run:

```bash
BASE_URL=https://vouchres.vercel.app npm run production-smoke
```

Paste the env table into the hosting dashboard, redeploy, then re-run smoke.
