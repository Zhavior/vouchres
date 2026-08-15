# HR-max scale rendering Implementation Plan

Status: APPROVED
Slug: 2026-08-14-hr-max-perf
Repo: /Users/boydsantos/Desktop/Projects/Vouch/vouchres
Mode: FULL
CONTEXT_STAMP: 2026-08-15T01:24:59Z (preflight env FAIL on missing .env copies; node/git/deps PASS)

## Goal
Stop save-toggles from invalidating all four tier columns and every queue/table row, without changing HR board data fetching, polling, or API contracts.

## In scope
- Phase 1: Record reducer, memoized leaves with `saved: boolean`, no collection passed below the row map
- Later phases only after Boyd confirms: desk subtree split, select/receipt split, virtualization

## Out of scope (this session = Phase 1 only)
- Virtualization (`useVirtualizer`)
- Data-fetching / polling / API contracts
- Visual restyle
- Deleting tests

## Files (Phase 1)
- `src/features/hr-max/components/HrMaxDesk.tsx` — Record reducer; stable `toggleSaved`; pass `savedMap` not `isSaved`
- `src/features/hr-max/components/HrMaxPlayerCard.tsx` — already memo + `saved: boolean` (keep)
- `src/features/hr-max/components/HrMaxCardBoard.tsx` — `savedMap` + per-tier memo compare; boolean to card
- `src/features/hr-max/components/HrMaxSlateQueue.tsx` — memo row leaf with `saved: boolean`
- `src/features/hr-max/components/HrMaxTableView.tsx` — memo row leaf with `saved: boolean`
- `src/features/hr-max/components/HrMaxMainPane.tsx` — plumbing `savedMap` (file exists from prior combined pass)

## Risks
- Prior commit `933cfe5a` combined passes 1–3; Phase 1 isolation was incomplete (`isSaved` identity still busted memo)
- `toggleSaved` must stay `(id: string) => void` for callers
- Source-contract tests grep `HrMaxDesk.tsx`

## Effort
Workers: 0
Iolaus: after Phase 1 verify

## Phases
1. Stabilize save-state rendering (this turn)
2. Split HrMaxDesk into memoized subtrees (wait)
3. Decouple selection from receipt state (wait)
4. Virtualize Queue, Cards, Table (wait)
