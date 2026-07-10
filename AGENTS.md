# VouchEdge Agent Rules

## Project
VouchEdge is a Vite React + Express/TypeScript MLB probability research app.

## Main commands
- Build: npm run build
- Dev: npm run dev
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

## Cursor Cloud specific instructions

Environment refresh (`npm install` + create `.env.local` if missing) runs automatically on startup, so you normally don't need to install anything.

- Single process: `npm run dev` serves both the Express API and the Vite React SPA on http://localhost:3000. Standard commands live in `package.json` (`dev`, `build`, `test`, `lint`, `lint:strict`, `typecheck`).
- `.env.local` is required to boot: the dev script runs `node --env-file=.env.local`, which errors if the file is missing. It is gitignored, so the update script recreates a minimal one. Copy from `.env.example` and add real Supabase/Stripe/Gemini keys only when you need auth/billing/AI.
- Runs with no secrets: in dev, missing config only warns (see `validateProductionEnvAtBoot`). The app opens in guest mode; the flagship HR board uses the free public MLB Stats API (no key). Fastest secret-free smoke check: `GET /api/health` and `GET /api/mlb/hr-board/today`.
- Tests: `npm test` (vitest). DB-backed tests skip/fail without `SUPABASE_URL_TEST` + `SUPABASE_SERVICE_ROLE_KEY_TEST` (see `.env.test.example`). `tests/hexTailwindDiscipline.test.ts` currently fails on the existing codebase (baseline drift) — not an environment problem.
- Lint: the `lint` script ends with `|| true` so it never fails; use `npm run lint:strict` for a real gate (it currently reports pre-existing issues).
- Separate sub-apps: `vouchedge/` and `vouchedge-terminal/` are standalone Next.js 16 apps with their own `package.json`; they are NOT part of the main dev server and each need their own `npm install` if you work on them.
