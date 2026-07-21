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

Dependencies are refreshed automatically on VM startup (`npm install`); no manual install step is needed.

- Run the app with `npm run dev` (see `## Main commands`). This is a single Node process: Express serves the API and runs Vite in middleware mode, so both the API and the SPA are on `http://localhost:3000`. There is no separate frontend dev server.
- Auth: Supabase is optional in dev. With no `SUPABASE_URL`/`VITE_SUPABASE_URL` + anon key, login is disabled and you'll see `[auth] Local login disabled`. For local dev without a Supabase project, create a gitignored `.env.local` with `VITE_DEV_BYPASS_AUTH=true` to skip the auth gate. For real auth/DB flows, either fill Supabase vars from a project or bring up the local stack via `docker compose up -d` (see `docker-compose.yml`).
- The HR board (core feature) fetches live data from the public MLB StatsAPI (`https://statsapi.mlb.com/api`, no key). It needs outbound network egress; without it the board falls back to degraded/cached states by design.
- Expected dev noise: boot logs `[boot] Missing required production config: ...` warnings — these only hard-fail when `NODE_ENV=production`, so they are safe to ignore in dev.
- Known baseline at HEAD (not caused by setup): `npm run lint:strict` fails on one pre-existing `prefer-const` error in `server/services/worldChat/worldChatService.ts` (the non-strict `npm run lint` passes). A handful of `vitest` source-assertion/component tests fail, and DB-hitting tests are skipped/fail unless `SUPABASE_URL_TEST` and `SUPABASE_SERVICE_ROLE_KEY_TEST` are set (`.env.test.local`).
