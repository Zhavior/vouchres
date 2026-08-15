# HR Max Cards page-scroll virtualization Implementation Plan

Status: DONE
Slug: 2026-08-15-hr-max-cards-page-scroll
Repo: /Users/boydsantos/Desktop/Projects/Vouch/vouchres
Mode: FULL

Boyd: implement the attached plan (Cards page-scroll virtualization).

## Goal
Cards on desktop virtualize against the live page scroller (`#inner-view-slot` when constrained, otherwise `document.body` / `documentElement`) with dynamic measurement and overscan 16. Mobile keeps inner column scroll. Do not use `useWindowVirtualizer` (window scrollY is 0 at ≥1181px).

## In scope
- `resolveCardBoardScroller.ts` + tests
- `HrMaxCardBoard.tsx` page-scroll mode
- `hr-max-desk.css` overflow-anchor + sticky column heads

## Out of scope
- Queue / Table page-scroll
- Aurora HQ
- `feed.css` rewrite
- Duplicate `* 2.tsx` files
- Cockpit plan
- Flattening 4 columns

## Files
- `src/features/hr-max/resolveCardBoardScroller.ts`
- `src/features/hr-max/components/HrMaxCardBoard.tsx`
- `src/features/hr-max/hr-max-desk.css`
- `tests/resolveCardBoardScroller.test.ts`
- `tests/hrMaxCardBoardWindowing.test.ts`

## Risks
- Wrong scroller mounts all cards or freezes the first window
- Stale `scrollMargin` after chrome height change

## Effort
Workers: 0
Iolaus: after diff
