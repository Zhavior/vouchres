# HR Intelligence — Aurora Max V2

Phase 0 discovery artifacts for the ground-up rebuild.

**Branch:** `codex/hr-intelligence-aurora-max-v2`  
## Phase status

| Phase | Status |
|---|---|
| 0 Discovery | Complete |
| 1 V2 foundation | Implemented (`src/features/hr-intelligence-v2/`) |
| 2 Free Field Desk | Implemented |
| 3 Pro workspaces + research | Implemented |
| 4 Parity | In progress — V1 files retained for rollback |
| 5 Performance gates | Pending browser torture test |
| 6 Route cutover | `routeModules.hrBoard` → V2 |
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
