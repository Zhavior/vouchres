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
