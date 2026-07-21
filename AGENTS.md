# VouchEdge Agent Rules

## Project
VouchEdge is a Vite React + Express/TypeScript MLB probability research app.

## Product map

Treat VouchEdge as a set of named systems, not a random pile of files:

- `ParlayOS`
- `TrustOS`
- `BillingOS`
- `SocialOS`
- `World Chat`
- `NotificationOS`
- `HR / Truth OS`
- `AI / Agent OS`
- `Mid-end / Platform OS`

For current system scores and upgrade direction, read:

- `docs/architecture/VOUCHRES_FEATURE_SYSTEMS_95_PLUS_AUDIT.md`
- `docs/architecture/VOUCHRES_BACKEND_94_PLUS_MATRIX.md`
- `docs/architecture/VOUCHRES_V3_PRODUCTION_ROLLOUT.md`
- `docs/architecture/VOUCHRES_V3_PRODUCTION_CUTOVER_CHECKLIST.md`

## Main commands
- Build: npm run build
- Typecheck: npm run typecheck
- Dev: npm run dev
- V3 backend verify: npm run verify:v3-backend
- Local API: http://localhost:3000/api/mlb/hr-board/today

## Important rule
Do not rewrite the whole app unless asked. Make small patches only.

## Token-saving rule
Before editing, inspect only the files needed for the task.
Do not scan the whole repo.
Do not summarize unrelated files.

## HR Board rules
The HR board must be honest and trust-first.
Do not fake lineups, odds, injuries, weather, or confirmed players.

Confirmed candidates:
- Use candidates[] only for official confirmed batting-order players.

Projection preview:
- Use projectedCandidates[] only for safe roster previews.
- Every preview row must warn: Official lineup not posted yet.
- Never call projected players confirmed.

Team safety:
- Block stale or mismatched players.
- A player must match sourceTeamId, activeRosterTeamId, and currentTeamId when available.
- Bad team/player rows must never reach candidates[].

Blocked reason:
Team mismatch / stale roster assignment

## Current truths

- `ParlayOS` is the strongest backend slice right now and has an active V3 replacement path.
- Local parlay cutover work is already proven route-by-route; do not casually reintroduce legacy behavior.
- `World Chat` in the current checkout is still in-memory and resets on restart unless code changes prove otherwise.
- `NotificationOS` persists in-app notifications, but push delivery is not production-complete unless code changes prove otherwise.
- `TrustOS` currently computes trust from pick history and cache; do not describe it as a canonical immutable ledger unless that work is actually implemented.
- `HR / Truth OS` already has real cache, fallback, and degraded-service patterns; preserve those when editing.

## Done means

Before claiming a backend or architecture change is done:

1. inspect only the needed files
2. run the real repo commands that apply
3. say what is proven versus what is still architectural intent

Minimum verification defaults:

- backend changes: `npm run typecheck` and the most relevant verify script
- broad backend/runtime changes: `npm run typecheck`, `npm run build`, and `npm run verify:v3-backend`
- frontend-only changes: `npm run typecheck` and `npm run build` when the touched surface can affect packaging

## Cursor Cloud specific instructions

- Single dev process: `npm run dev` runs Express + Vite (middleware mode) on one port, `http://localhost:3000`. It serves both the `/api/*` backend and the React SPA/HMR. There is no separate frontend server. Run it under tmux for long-lived sessions.
- The server boots fine in dev with no `.env.local`. Missing Supabase/Upstash/Stripe/Sentry/Gemini/CRON config only logs `[boot] Missing required production config` warnings and degrades gracefully; `validateProductionEnvAtBoot()` only hard-fails when `NODE_ENV=production`.
- Core research surface (HR / Truth OS) works with only outbound internet to the free MLB Stats API — no keys needed. Smoke it with `curl http://localhost:3000/api/mlb/hr-board/today` (returns real MLB data).
- Auth-gated features (login, picks, billing, social) need a Supabase project (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, plus `VITE_` mirrors). Without it the UI shows the landing page and a login gate; `[auth] Local login disabled` is logged. `docker-compose.yml` can bring up a local Supabase stack if a real project is unavailable (requires Docker).
- `npm run lint` intentionally ends in `|| true` and will exit 0 even with pre-existing errors/warnings (currently ~4 errors, ~1179 warnings in the checked-in code). Use `npm run lint:strict` for a failing lint gate on `src server tests`.
- Optional V3 backend is a separate process: `npm run dev:v3` on port 3100. Not required for the main app to run end-to-end.
