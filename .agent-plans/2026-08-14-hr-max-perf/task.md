# HR-max scale rendering Tasks

- `[x]` **Phase 1 — Stabilize save-state rendering**
  - `[x]` Replace `useState<Set<string>>` with `useReducer` + `Record<string, true>`
  - `[x]` `HrMaxPlayerCard` memo + `saved: boolean`
  - `[x]` Stop passing `isSaved` / saved collection below the row map (CardBoard, Queue, Table)
  - `[x]` Stabilize `toggleSaved` so callback identity does not change on each star
  - `[x]` Per-tier `React.memo` compare so untouched columns skip
  - `[x]` Memo queue/table row leaves with primitive `saved`
  - `[x]` Quality gate: `npx tsc --noEmit` (0 errors) + `npx vitest run` (1325 pass / 0 fail / 34 skipped)
- `[ ]` **Phase 2 — Split HrMaxDesk into memoized subtrees** (blocked on Boyd confirm)
- `[ ]` **Phase 3 — Decouple selection from receipt state** (blocked on Boyd confirm)
- `[ ]` **Phase 4 — Virtualize Queue, Cards, Table** (blocked on Boyd confirm)
- `[ ]` **Phase 2 — Split HrMaxDesk into memoized subtrees** (blocked on Boyd confirm)
- `[ ]` **Phase 3 — Decouple selection from receipt state** (blocked on Boyd confirm)
- `[ ]` **Phase 4 — Virtualize Queue, Cards, Table** (blocked on Boyd confirm)
