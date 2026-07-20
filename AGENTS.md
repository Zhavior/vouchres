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
