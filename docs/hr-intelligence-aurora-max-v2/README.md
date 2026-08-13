# HR Intelligence — Aurora Max V2

Phase 0 discovery artifacts for the ground-up rebuild.

**Branch:** `codex/hr-intelligence-aurora-max-v2`  
**Status:** Phase 0 complete — no V2 implementation code yet.

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
