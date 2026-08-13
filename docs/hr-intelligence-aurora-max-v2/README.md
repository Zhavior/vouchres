# HR Intelligence — Aurora Max V2

Phase 0 discovery artifacts for the ground-up rebuild.

**Home Run Intelligence (`/hr-board`) is not modified and stays the current page.**

New page: sidebar **HR Aurora Max** → `/hr-aurora-max` (eager load, Aurora Max primitives, HR APIs).

## Phase status

| Phase | Status |
|---|---|
| 0 Discovery | Complete |
| 1–3 New page | Shipped as a separate route, not a cutover |
| 6 Route cutover | Cancelled — V1 remains canonical HR Intelligence |
| 7 V1 deletion | Not started |


## Documents

| Doc | Purpose |
|---|---|
| [PHASE0_ARCHITECTURE_MAP.md](./PHASE0_ARCHITECTURE_MAP.md) | Sources of truth, architecture map, scroll ownership, design contracts |
| [PHASE0_FEATURE_PARITY_AND_MIGRATION_LEDGER.md](./PHASE0_FEATURE_PARITY_AND_MIGRATION_LEDGER.md) | Capability inventory + migration ledger |
| [PHASE0_CLASSIFICATION_MAP.md](./PHASE0_CLASSIFICATION_MAP.md) | KEEP → REUSE → REBUILD → DELETE AFTER CUTOVER |

## Canonical design reference

Sidebar → **Aurora HQ** → tab **Aurora Max** → Field Desk System lab

- Shell: `src/features/admin/AuroraHqShell.tsx`
- Tabs: `src/components/admin/AdminDashboard.tsx` (`aurora-max`)
- Artifact: `src/components/admin/AuroraMax.tsx`
- Primitives: `src/components/aurora-max/AuroraMaxPrimitives.tsx`
- Tokens: `src/styles/aurora-max.css`
