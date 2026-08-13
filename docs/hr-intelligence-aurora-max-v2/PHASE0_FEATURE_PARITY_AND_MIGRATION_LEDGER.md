# Phase 0 — Feature Parity & Migration Ledger

Every HR V1 capability is classified. Status columns update as phases complete.

Legend:

- **Parity verified / Perf verified:** `—` until Phase 4–5
- **Entitlement:** Free = Standard Mode; Pro = Pro Mode surfaces; Sub = subscription gate (`ProResearchGate`)
- **V2 capability:** target product surface (not a 1:1 layout clone)

---

## Migration ledger

| Legacy capability | V2 capability | Status | Entitlement | Parity | Perf | Legacy files eligible for deletion (after cutover) |
|---|---|---|---|---|---|---|
| Today's HR Board / Research workspace board | Aurora Max Ranked Board (Free + Pro Overview) | DISCOVERED | Free + Pro | — | — | `HomeRunIntelligencePageZ8.tsx`, `HrBoard.tsx`, `HrColumn.tsx`, `OverviewView.tsx` |
| Free Standard spotlight + signal grid | Free Field Desk: spotlight + ranked queue | DISCOVERED | Free | — | — | `HrSpotlightDeck.tsx`, `HrSignalGrid.tsx` |
| Pro tier columns / player cards | Aurora Max ranked rows + player identity cells | DISCOVERED | Pro | — | — | `HrPlayerCard.tsx`, `HrOpportunitySummary.tsx` |
| Command Center / toolbar filters | Shared Max controls: search, source mode, tiers, view | DISCOVERED | Pro | — | — | `HrCommandCenter.tsx`, `HrToolbar.tsx` |
| Workspace switcher | Shared Max workspace nav | DISCOVERED | Pro | — | — | `WorkspaceSwitcher.tsx`, `WorkspaceRenderer.tsx` |
| Edge Desk | Pro Edge Desk (model vs market +EV) | DISCOVERED | Pro | — | — | `EdgeDeskView.tsx` |
| Slate Stacks | Pro Slate Stacks (team combinations) | DISCOVERED | Pro | — | — | `SlateStacksView.tsx` |
| Projection Matrix | Pro Projection Matrix (decision scatter — honesty-first metrics) | DISCOVERED | Pro | — | — | `ProjectionMatrixView.tsx` |
| Matchup Extremes | Pro Extremes (outlier signals) | DISCOVERED | Pro | — | — | `MatchupExtremesView.tsx` |
| Top Signal / Signal Field / Spreadsheet | Pro advanced board presentations | DISCOVERED | Pro | — | — | `HrTopSignalPanel.tsx`, `HrSignalField.tsx`, `HrSpreadsheet.tsx` |
| Player research overlay | Aurora Max Research Dossier | DISCOVERED | Free open; 12 Layers Sub | — | — | `HrPlayerProfile.tsx`, profile section components, `hr-profile.css` |
| 12 Layers gate | Keep Pro research gate (subscription-aware) | DISCOVERED | Sub | — | — | `ProResearchGate` wiring inside profile (rebuild gate UX) |
| Most Vouched / vouch actions | Pro social vouch layer | DISCOVERED | Pro (+ auth for mutate) | — | — | `MostVouched*.tsx` |
| Live slate pill + HR results grading | Live slate status + results intelligence | DISCOVERED | Free + Pro | — | — | Live chrome in `HrHeader.tsx` / `hr-command.css` (presentation only) |
| Header / Pro Mode toggle / brand | Max shell header + entitlement controls | DISCOVERED | Free + Pro | — | — | `HrHeader.tsx`, `HrProModeToggle.tsx`, `HrBrandIcon.tsx` |
| Loading / error / empty / last-good | Shared Max state architecture | DISCOVERED | Free + Pro | — | — | Inline V1 state components on page |
| HR Aurora CSS overlays | V2-owned Max shell styles (tokens reused) | DISCOVERED | Free + Pro | — | — | `hr-aurora-max.css`, `hr-command.css`, `z8-hr-lens*.css` |
| Orphan IntelligenceWorkspaceView / WorkspaceShell | None (delete) | DISCOVERED | — | n/a | n/a | `IntelligenceWorkspaceView.tsx`, `WorkspaceShell.tsx` |
| Orphan HrFilters / HrSearch / HrTreemap | None (delete; replaced by toolbar/signal field) | DISCOVERED | — | n/a | n/a | `HrFilters.tsx`, `HrSearch.tsx`, `HrTreemap.tsx` |
| Unused HR hooks/adapters | None (delete if still unused at cutover) | DISCOVERED | — | n/a | n/a | `useHrEngineBoard.ts`, `useHrBoardFilters.ts`, `useHrBoardSelection.ts`, unused aurora adapters |
| Client scoring engine folder | Prefer server pipeline; keep only helpers still needed by V2 adapter | DISCOVERED | — | — | — | Most of `features/hr/engine/*` after import audit |
| Adjacent legacy hubs (`DailyPlayersPageZ8`, `MlbIntelligenceHubZ8`) | Out of HR V2 cutover scope unless still routed as HR | DISCOVERED | — | — | — | Evaluate separately; do not block HR V2 |

---

## Capability detail (product → decision)

### Free (Standard)

| Capability | User decision | Data | Notes |
|---|---|---|---|
| Ranked board / signal grid | Who deserves attention today | Board API | Same quality shell as Pro |
| Spotlight picks | Fast shortlist (top/power/matchup/value) | Client selection over board rows | Rebuild interaction using Max Spotlight pattern |
| Player open → overview research | Evidence brief before acting | Board row + research API | Full dossier chrome Max-native |
| Live slate awareness | Is today live / historical | Header + feed | Not a separate Live app |
| Clear Pro upgrade boundary | What deeper intel exists | Entitlement UI | One product language |

### Pro (full desk)

| Capability | User decision | Data | Notes |
|---|---|---|---|
| Edge Desk | +EV vs market; skip when odds missing | Board probs/odds | Fail-closed empty states |
| Slate Stacks | Team stack constructions | Grouped board rows | |
| Projection Matrix | Elite targets vs traps | Layer scores | Fix V1 default-to-50 honesty risk |
| Extremes | Peak outliers | Board metrics | |
| Filters / search / view modes | Narrow slate | Client filters | Prefer `AuroraMaxControl` |
| Top signal / map / spreadsheet | Alternate scanning modes | Board | Feature flags: map on, export off |
| Most Vouched | Community-backed bats | Vouch APIs | |
| Advanced research (12 Layers etc.) | Deep evidence | Research API | Subscription gate remains |

### Explicit non-capability

| Name in brief | Reality |
|---|---|
| “Live Intelligence” workspace | **Not wired** in HR V1. Marketing/landing exists separately. V2 preserves live slate + HR grading, not a fabricated workspace clone. |

---

## Backend / domain reuse checklist

| Asset | Class | Notes |
|---|---|---|
| `GET /api/mlb/hr-board/today\|date` | REUSE | Compact transport + last-good |
| `GET /api/mlb/hr-board/player/:id` | REUSE | Research Zod contract |
| `GET /api/mlb/hr-feed/today\|date` | REUSE | Results grading |
| `hrBoardHub` / pipeline / engine | REUSE | Server source of truth |
| `hrBoardApiContract` / `normalizeHrWatch` / `HrWatchRow` | REUSE via adapter | May wrap in V2 read-model |
| `useHrBoardViewModel` truth/mode rules | REUSE intent | Reimplement behind V2 boundary if coupling is presentation-heavy |
| `hrResearchRoute` history ownership | REUSE intent | Keep `?hrPlayer=` ownership clear |
| Staff `/today/debug`, `/v2-shadow` | KEEP server | Not Free UX |

---

## Parity rules for later phases

1. No silent feature loss — every KEEP/REBUILD row must reach **parity verified**.
2. Differences must be intentional and logged in this ledger.
3. DELETE rows only after Phase 6 cutover verification.
4. Performance gates (Phase 5) required before production cutover.
