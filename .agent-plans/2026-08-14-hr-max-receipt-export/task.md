# HR Max receipt export Tasks

- `[ ]` **Phase 1 — Honest receipt export**
  - `[ ]` Add `src/features/hr-max/exportDeskReceipts.ts` (JSON + Markdown + SHA-256 checksum of JSON bytes)
  - `[ ]` Wire `HrMaxDesk.tsx` `handleExport` (starred else visible rows)
  - `[ ]` Tests: canonical payload + checksum; forbid signature/Statcast theater strings
  - `[ ]` Quality gate: `npx tsc --noEmit` + `npx vitest run`
- `[ ]` **Optional — Aurora HQ** (only if Boyd expands scope)
  - `[ ]` Replace duplicate `exportReceipts` in `AuroraHqDesk.tsx`
