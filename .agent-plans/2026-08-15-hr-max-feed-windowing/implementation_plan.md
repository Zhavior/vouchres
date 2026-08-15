# HR Max feed windowing Implementation Plan

Status: DONE
Slug: 2026-08-15-hr-max-feed-windowing
Repo: /Users/boydsantos/Desktop/Projects/Vouch/vouchres
Mode: FULL

Boyd: "okay lets do it" — Twitter Lite windowing + Reddit height-from-data on the live Command Desk.

## Goal
Keep four 1D TanStack virtualizers. First-paint row height comes from known desk data (`receiptOpen`, evidence count), then `measureElement` corrects wrap. No per-card lazy. No photo masonry.

## Files
- `src/features/hr-max/estimateDeskRowSize.ts` — size-from-data
- `src/features/hr-max/components/HrMaxCardBoard.tsx` — `estimateSize(index)` + memoized `tierRows`
- `src/features/hr-max/components/HrMaxSlateQueue.tsx` — `estimateSize(index)` from receipt
- `src/features/hr-max/components/HrMaxTableView.tsx` — `getItemKey` + `measureElement`
- `tests/estimateDeskRowSize.test.ts`

## Out of scope
- Cryptographic exporter
- `React.lazy` per card
- Replacing 4 columns with one masonry
- Data-fetching / API contracts
