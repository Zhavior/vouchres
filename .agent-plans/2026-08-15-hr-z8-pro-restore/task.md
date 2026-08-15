# Restore HR Intelligence Pro (original z8 suite) Tasks

- `[x]` **Phase 1 — Standard + Pro toggle**
  - `[x]` `useProMode()` on `HomeRunIntelligencePageLegacy`
  - `[x]` `HrHeader` gets `isProMode` / `onToggleProMode` / `onProModeIntent` → `preloadSection('player_edge_lab')`
  - `[x]` Standard: `HrSpotlightDeck` + `HrSignalGrid` from `vm.rows`; research + slip handlers unchanged
  - `[x]` Quality gate: toggle visible in render; Standard does not mount `HrBoard` / `WorkspaceSwitcher`
- `[x]` **Phase 2 — Pro suite**
  - `[x]` Persist workspace in `vouchedge_hr_workspace`
  - `[x]` Pro: `HrCommandCenter` + `WorkspaceSwitcher` + `WorkspaceRenderer`
  - `[x]` Overview children: top signal, most-vouched, cards/table/map (current Pro-density body)
  - `[x]` Edge / stacks / matrix / extremes: existing views + `getHrResult`
  - `[x]` Quality gate: no `React.lazy` / `lazyWithRetry` inside `src/features/hr/pages/`
- `[x]` **Phase 3 — Verify**
  - `[x]` Extend `tests/hrLegacyPage.test.tsx` for toggle + Standard vs Pro
  - `[x]` `npx tsc --noEmit` PASS; `npx vitest run tests/hrLegacyPage.test.tsx` 3/3 PASS
  - `[x]` Screenshots: `.agent-plans/2026-08-15-hr-z8-pro-restore/receipts/`
  - `[x]` Iolaus on the diff
