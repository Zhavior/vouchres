# VouchEdge Star Watch Status Fix Report

## Task
Fix Star Watch status on Daily HR Board so projected preview players do not show as excluded when `candidates[]` is empty and `projectedCandidates[]` is populated.

## Agent Used
Codex implementation pass

## Skills Used
- Backend/runtime inspection
- Frontend state/render inspection

## Gates Used
- Build verification
- Endpoint truth verification

## Files Inspected
- `server/services/mlb/hrPipeline.ts`
- `src/pages/DailyHrBoardPage.tsx`
- `package.json`

## Files Created
- `VOUCH_EDGE_STAR_WATCH_STATUS_FIX_REPORT.md`

## Files Changed
- `server/services/mlb/hrPipeline.ts`
- `src/pages/DailyHrBoardPage.tsx`

## Bugs Found
1. Star Watch only checked `candidates[]` and `blockedPlayers`, so players present in `projectedCandidates[]` fell through to excluded.
2. Star Watch badge rendering only supported included/blocked/excluded and had no preview state.
3. Blocked mismatch cards could surface the wrong observed team as the main displayed team label.

## Fixes Made
1. Updated Star Watch backend logic to check:
   - `candidates[]`
   - `projectedCandidates[]`
   - `blockedPlayers`
   - verified `pool`
2. Added explicit Star Watch states and labels:
   - `included` -> `CONFIRMED`
   - `preview` -> `PREVIEW`
   - `waiting` -> `WAITING`
   - `blocked` -> `BLOCKED`
   - `excluded` -> `EXCLUDED`
3. Added waiting-vs-blocked classification based on blocked reason text:
   - lineup/pitcher pending -> `waiting`
   - true inactive/injured/not-eligible -> `excluded`
   - other validation failures -> `blocked`
4. Updated the Daily HR Board page to render the new badge colors/text for preview, waiting, blocked, and confirmed states.
5. Kept the star’s expected team label stable while moving observed mismatched team info into the note.

## Build Result
`npm run build` passed.

## Pages Tested
- Daily HR Board backend payload verified
- Daily HR Board Star Watch frontend render path verified by code inspection

## Endpoint Verification
Verified against:
- `GET /api/mlb/hr-board/today`

Observed after fix:
- `Shohei Ohtani` -> `status: "preview"`, `label: "PREVIEW"`
- `Cal Raleigh` -> `status: "preview"`, `label: "PREVIEW"`
- Both also appeared in `projectedCandidates[]` with:
  - `lineupStatus: "projected_unconfirmed"`
  - `dataQuality: "projection_preview"`

## Remaining Risks
1. Star Watch still depends on a manual star list. If the featured list should become dynamic later, that should be a separate task.
2. Some blocked stars can still surface stale observed-team notes if the upstream data source is stale, though they no longer show the wrong team as the main label.
3. Frontend page verification here was done through build plus endpoint inspection, not a full browser screenshot pass.

## Next Recommended Task
Move the Star Watch featured-player list into a small backend config/source-of-truth file so the set of tracked stars is easier to maintain without touching pipeline logic.
