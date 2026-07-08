# VouchEdge Live Projections Patch Report

## Task
Fix and patch the Live Projections screen so it does not sit on a blank/background state while loading.

## Files Changed
- `src/App.tsx`
- `src/components/LiveGamesPro.tsx`

## Bugs Found
- Live Projections depended on the heavier matchup model before showing useful cards.
- Missing/null matchup fields could crash or create blank states.
- Direct local hash access did not support `#live-projections`.

## Fixes Made
- Added fast first paint from the verified HR Board payload.
- Kept deeper matchup enrichment, but it no longer blocks the page.
- Added timeouts around slow live projection calls.
- Added safe optional handling for:
  - `winProbability`
  - `score`
  - `topHrWatch`
  - `winProbModel`
  - `runEnvironment.reasons`
  - `keyFactors`
  - `whatToWatch`
- Added honest display copy:
  - no fake win probability
  - no fake RBI/run/hit data
  - source status note
- Added direct dev routes:
  - `#live_games`
  - `#live-projections`

## What Was Not Changed
- HR scoring
- HR rankings
- Player matching
- Pitcher matching
- Backend routes
- Share-card endpoint

## Verification
- `npm run build` passed.
- Browser verified `http://127.0.0.1:3000/#live-projections`.
- Page rendered 15 Live Projection cards.
- No React runtime errors found.

## Remaining Risk
- Full matchup enrichment can still be slow when the backend needs to rebuild cache, but the page now renders the fast HR-board preview first.
