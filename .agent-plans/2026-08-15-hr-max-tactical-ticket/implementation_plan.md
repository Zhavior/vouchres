# HR Max mobile tactical ticket

Status: APPROVED
Slug: 2026-08-15-hr-max-tactical-ticket
Repo: /Users/boydsantos/Desktop/Projects/Vouch/vouchres
Mode: FULL
CONTEXT_STAMP: 2026-08-15T03:15:32Z
Approval: user blueprint is the lock (exact mobile ticket spec).

## Goal
Dense ~78px HRPI tickets on the live Command Desk: one honest catalyst, three evidence pips, sticky exclusive mobile tiers, clean matchup line, row-tap receipt, docked My List. Desktop keeps 4-column virtualized board.

## In scope
- Compact `HrMaxPlayerCard` ticket (~78px closed)
- Catalyst from existing `signal` / evidence layers (no invented Barrel%/wind)
- Sticky mobile tier segmented control (exclusive Elite/Strong/Watch/Sleepers)
- Drop repeated team codes; keep `formatGameTime` honesty
- Row tap → receipt; Slip stays its own control
- Replace overlapping mobile My List FAB with a bottom dock
- Recalibrate `estimateCardRowSize` (~86px closed, prefer tall)

## Out of scope
- Cryptographic receipt exporter
- Invented `7:10 PM EDT` / `🔥 18.2% Barrel vs Fastball`
- Unvirtualized dump of all tiers (L021)
- `chronos repair --apply`
- Per-card `React.lazy` (L024)

## Files
- `src/features/hr-max/presentHrMaxTicket.ts` — matchup/catalyst/pips
- `src/features/hr-max/components/HrMaxPlayerCard.tsx`
- `src/features/hr-max/components/HrMaxCardBoard.tsx`
- `src/features/hr-max/components/HrMaxToolbar.tsx`
- `src/features/hr-max/components/HrMaxMainPane.tsx`
- `src/features/hr-max/components/HrMaxDesk.tsx`
- `src/features/hr-max/components/HrMaxSpotlight.tsx`
- `src/features/hr/hooks/useHrBoardViewModel.ts` — `onFocusTier`, `poolStats`
- `src/features/hr-max/estimateDeskRowSize.ts`
- `src/features/hr-max/hr-max-desk.css`
- `src/components/parlay/os/ParlayOsLayer.tsx`
- `tests/presentHrMaxTicket.test.ts`
- `tests/estimateDeskRowSize.test.ts`

## Risks
- Exclusive mobile tier would zero tab counts if they used `stats` (filtered) — use `poolStats`
- Short `estimateSize` reintroduces overlap (L029/L031)
- FAB change is global ParlayOS, not HR-only

## Effort
Workers: 0
Iolaus: after diff
Chronos: UNKNOWN — no live URL this turn
