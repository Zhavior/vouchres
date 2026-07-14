# Production deploy checklist

Ordered ship checklist for VouchEdge. Code-side items are automated; operator items need Render / Supabase / Vercel dashboards.

Canonical hosting model: **Render API + Render cron**, Vercel frontend-only (`vercel.json` → `"crons": []`). See `docs/PRODUCTION_HOSTING.md`.

## Checklist

### Code merge (repo)

- [x] P0–P4 hardening on `main` (#79–#84)
- [x] CI green baseline (#82)
- [x] Staging soak parlay auth gates (#85)
- [ ] Supabase auth URLs + `/auth/callback` (#86)

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

- [ ] `vercel.json` crons remain `[]` (verified by `production-smoke --local`)
- [ ] `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_API_BASE_URL` = Render API origin
- [ ] `VITE_SENTRY_DSN` (recommended)

### Supabase auth URLs (step 5)

- [ ] Dry-run: `npm run configure:supabase-auth-urls`
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

This cloud agent cannot set Render / Supabase / Vercel secrets. Paste the env table into the Render dashboard, then run `production-smoke` against the live `BASE_URL`.
