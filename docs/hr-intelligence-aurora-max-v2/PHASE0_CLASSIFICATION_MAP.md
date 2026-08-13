# Phase 0 — KEEP → REUSE → REBUILD → DELETE AFTER CUTOVER

Unclassified legacy HR features are not allowed. This map is the gate for Phase 1.

---

## KEEP

Healthy product behavior / infrastructure that remains valid (intent or system), independent of V1 chrome.

| Item | Why |
|---|---|
| Single `hr_board` / `/hr-board` product entry | One product surface for Free + Pro |
| Truth-first confirmed vs projected semantics | Core product honesty |
| Last-good / degraded board warnings | Production resilience |
| Live slate awareness + real HR results grading | Live workflow without fake “Live Intelligence” workspace |
| Fail-closed Edge Desk when odds/prob missing | Correct decision hygiene |
| Pro research subscription gate for 12 Layers | Existing entitlement boundary |
| Open-beta tier elevation flag behavior | Do not invent new entitlement rules |
| Staff-only board debug/shadow endpoints | Ops tooling |
| Aurora Max visual contract (tokens + primitives) | Design system already canonical |
| App-level `#inner-view-slot` scroll provider concept | Primary scroll owner pattern — V2 must own usage cleanly |

---

## REUSE

Backend / domain / design-system assets V2 intentionally consumes.

### Design system

- `src/styles/aurora-max.css` + `--aurora-max-*` tokens
- `src/theme/auroraTokens.ts` (`AURORA_MAX_*`)
- `src/components/aurora-max/AuroraMaxPrimitives.tsx`
- `src/components/aurora-max/AuroraMaxRouteFrame.tsx` (density modes; evaluate whether HR needs a V2-owned frame)

### Data / contracts / services

- `server/routes/mlbHrBoardRoutes.ts`
- `server/services/hubs/hrBoardHub.ts`
- `server/services/mlb/hrPipeline.ts` + `hr-engine/*`
- `server/services/mlb/hrResearchSnapshotService.ts` / research response builders
- `server/services/mlb/hrFeedService.ts`
- `server/services/mlb/hrBoardResponse.ts`
- `src/api/hrBoardApiContract.ts`
- Board query/repository loaders used by `useDailyHrBoard`
- `normalizeHrWatch` / `HrWatchRow` types (via V2 read-model adapter)
- `useHrResearch` / research Zod contracts
- `useHrResultsForDate` / hr-feed loaders
- Player vouch APIs for Most Vouched
- Boot seeding (`claimEarlyHrBoard` / boot store) if still beneficial

### Product rules to preserve (may be reimplemented)

- Source modes: confirmed / preview / all + auto-preview when no official lineups
- Tier vocabulary: Elite / Strong / Watch / Sleepers
- Feature flags: `HR_MAP_ENABLED`, `HR_EXPORT_ENABLED` (`featureAvailability.ts`)

---

## REBUILD

Existing capabilities receiving new Aurora Max implementations (new code, new architecture).

### Free

| Capability | Decision supported |
|---|---|
| Standard ranked board | Daily HR attention set |
| Spotlight selection | Fast shortlist |
| Player cards / identity rows | Compare candidates |
| Core Aurora signals (truth badges, evidence cues) | Trust state at a glance |
| Basic matchup / slate context | Game context without Pro desk |
| Navigation + states (loading/empty/error/degraded) | Operable product |
| Research overview / decision brief | Act with evidence |
| Clear Pro upgrade boundaries | Entitlement clarity |

### Pro

| Capability | Decision supported |
|---|---|
| Shared Max shell + workspace nav | One desk, many tools |
| Research workspace / Overview board | Ranked operations |
| Edge Desk | Model vs market edge |
| Slate Stacks | Team stacks |
| Projection Matrix | 2D opportunity vs trap |
| Matchup Extremes | Outlier hunting |
| Advanced filters / search / view modes | Slate narrowing |
| Top signal / signal field / spreadsheet | Alternate scanning |
| Deep player analysis (layers, BvP, form, team) | Research depth |
| Most Vouched + vouch actions | Social confirmation |
| Advanced Aurora intelligence surfaces | Evidence ladder / receipts |

### Cross-cutting rebuild

| Concern | Requirement |
|---|---|
| Scroll architecture | One primary vertical owner; no V1 nested traps |
| Responsive | Intentional mobile/tablet/desktop — not squeezed desktop |
| Accessibility | Semantic controls, focus, contrast, reduced motion |
| Performance | Stable identity; no scroll remount/network storms |
| Read-model boundary | Clean V2 contracts; adapters over legacy UI assumptions |

---

## DELETE AFTER CUTOVER

Legacy frontend presentation obsolete once V2 is verified on the production route.  
**Do not delete in the same step as first cutover.** Backend/data stays.

### High-confidence presentation deletes

| Path | Reason |
|---|---|
| `src/features/hr/pages/HomeRunIntelligencePageZ8.tsx` | V1 page shell |
| `src/features/hr/components/Cards/**` | V1 cards |
| `src/features/hr/components/Columns/**` | V1 board columns |
| `src/features/hr/components/CommandCenter/**` | V1 chrome |
| `src/features/hr/components/Toolbar/**` | V1 toolbar |
| `src/features/hr/components/Header/**` | V1 header |
| `src/features/hr/components/Spotlight/**` | V1 free deck |
| `src/features/hr/components/Standard/**` | V1 free grid |
| `src/features/hr/components/Hero/**` | V1 top signal |
| `src/features/hr/components/SignalField/**` | V1 map field |
| `src/features/hr/components/Table/**` | V1 spreadsheet |
| `src/features/hr/components/Social/**` | V1 vouch UI |
| `src/features/hr/components/Opportunity/**` | V1 opportunity chrome |
| `src/features/hr/components/Profile/**` | V1 dossier shell |
| `src/features/hr/components/workspace/**` | V1 workspaces |
| `src/features/hr/components/Drawer/HrPlayerDrawer.tsx` | Parallel drawer |
| `src/features/hr/hr-aurora-max.css` | V1 atmosphere coupling to feed IDs |
| `src/features/hr/hr-command.css` | V1 chrome |
| `src/styles/z8-hr-lens.css` | V1 lens |
| `src/styles/z8-hr-lens 2.css` | Duplicate artifact |
| `src/styles/hr-profile.css` | V1 profile scroll/layout |

### Orphans / dead presentation (delete when still unused)

| Path | Reason |
|---|---|
| `components/workspace/views/IntelligenceWorkspaceView.tsx` | Unwired |
| `components/workspace/WorkspaceShell.tsx` | Unused |
| `components/Filters/HrFilters.tsx` | Superseded |
| `components/Search/HrSearch.tsx` | Superseded |
| `components/Treemap/HrTreemap.tsx` | Unused import path |
| `hooks/useHrEngineBoard.ts` | No consumers |
| `hooks/useHrBoardFilters.ts` | No consumers |
| `hooks/useHrBoardSelection.ts` | No consumers |
| `adapters/hrAuroraAdapter.ts` / `utils/aurora/hrAuroraAdapter.ts` | Unused by page graph (confirm at cutover) |
| Large unused portions of `features/hr/engine/*` | Server pipeline is SoT — prune after import audit |
| `review-upload/src/features/hr/**` | Mirror dump (if still present) |

### Explicitly NOT deleted with HR V1 frontend

- MLB HR board/research/feed APIs and services
- Aurora Max global tokens/primitives
- Auth / subscriptions / entitlements infrastructure
- SportsTruthHub / scoring pipeline
- App shell routing framework (only `hr_board` child swaps at cutover)

---

## Contamination blacklist (never carry into V2)

- Legacy `feed.css` as HR layout dependency
- Nested vertical scroll stacks / competing scroll owners
- Scroll-driven layout mutation
- Index-based React identity for players
- Duplicate live-game / board state stores without ownership
- Unnecessary dynamic import forests inside scroll paths
- Giant compositor-heavy glass surfaces
- Compatibility layers whose only job is preserving V1
- Component-for-component translation of Edge Desk / Matrix / etc.

---

## Phase 0 exit criteria

- [x] Aurora Max artifact inspected at real HQ path
- [x] HR V1 capabilities inventoried
- [x] Free/Pro boundaries documented from code (not invented)
- [x] Backend reuse targets identified
- [x] Scroll ownership risks documented
- [x] KEEP / REUSE / REBUILD / DELETE map complete
- [x] Migration ledger created
- [ ] Human acceptance → proceed to Phase 1 foundation
