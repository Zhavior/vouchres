# VouchEdge HR Share Card Endpoint Report

## Task
Add a safe HR Board player share-card image endpoint and wire it into the HR player drawer.

## Files Changed
- `api/share/hr-card.ts`
- `server/services/share/hrShareCard.ts`
- `server/routes/shareRoutes.ts`
- `server/routes/index.ts`
- `src/components/hr-board/HrPlayerDrawer.tsx`
- `src/pages/DailyHrBoardPage.tsx`
- `src/types/hrBoard.ts`

## What Was Added
- Vercel route: `GET /api/share/hr-card`
- Local Express route: `GET /api/share/hr-card`
- Shared SVG renderer/validator for HR share cards.
- HR drawer actions:
  - `Share Image`
  - `Copy URL`

## Trust/Data Rules
- No HR scoring was changed.
- No HR ranking was changed.
- No fake stats, odds, lineups, or results were added.
- Share card uses existing HR Engine Pro v2 candidate payload only.
- Share card includes responsible copy: probability-based research, not betting advice, no guarantees.

## Verification
- `npm run build` passed.
- TypeScript check passed for the share route/helper files.
- Frontend HR page bundle check passed.
- Vercel handler mock returned SVG for Byron Buxton.
- Local Express route returned SVG for Byron Buxton.
- Missing-player request returns clean `404` JSON.

## Local URL
Example:

```text
http://127.0.0.1:3000/api/share/hr-card?playerId=621439&theme=dark
```

## Remaining Risks
- SVG is the first supported format. PNG export can be added later if needed.
- The drawer currently opens/copies the SVG URL; social-platform upload flow is not built yet.
- Share card depends on the current HR Board candidate list for the selected date.

## Next Recommended Task
Add a polished preview modal for the share card inside the HR player drawer before sending users to a new tab.
