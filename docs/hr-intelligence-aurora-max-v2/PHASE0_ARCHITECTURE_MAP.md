# Phase 0 — Architecture Map

**Branch verified:** `codex/hr-intelligence-aurora-max-v2` (created from `main`; remote branch did not exist).  
**Working tree at discovery:** clean relative to base.  
**Scope:** discovery only — no production implementation edits.

---

## 1. Three sources of truth

| Source | Role | Canonical locations |
|---|---|---|
| **A. Aurora Max artifact** | Design / interaction | Aurora HQ → tab `aurora-max` → `src/components/admin/AuroraMax.tsx` |
| **B. HR Intelligence V1** | Product requirements only | `src/features/hr/` → `HomeRunIntelligencePageZ8` |
| **C. Backend / domain** | Data & entitlements | `server/routes/mlbHrBoardRoutes.ts`, HR hub/pipeline, research/feed services |

V2 must **not** treat HR V1 presentation as reusable architecture.

---

## 2. Repository architecture (relevant slice)

```
AppShell
  HomeFeedLayout
    #inner-view-slot.ve-scroll-pane          ← current primary vertical scroll
      AuroraMaxRouteFrame (dense for hr_board)
        HomeRunIntelligencePageZ8            ← HR V1 (reference only)
```

Admin design reference path:

```
FeedSidebar section=admin
  → MainViewRouter → AuroraHqShell
    → AdminDashboard tab=aurora-max
      → AuroraMax (Field Desk System lab)
```

Product entry:

| Item | Evidence |
|---|---|
| Feature id | `hr_board` — `src/lib/featureConfig.ts` |
| Alias | `daily_hr_watch_new` → same page |
| Pathname | `/hr-board` — `src/features/hr/utils/hrResearchRoute.ts` |
| Router | `src/components/routing/MainViewRouter.tsx` |

---

## 3. Aurora Max design contract (inspect, then reuse)

### Artifact identity

- Title: **Aurora Max — Field Desk System**
- Test id: `aurora-max-lab`
- Lab chrome: Desktop / Mobile preview frames (`max-w-[1440px]` / `390px`)
- Composition: Command header → Spotlight → Ranked workspace (queue) → Receipts → Truth badges

### Reusable design-system pieces (V2 should import)

| Asset | Path |
|---|---|
| CSS tokens / surfaces | `src/styles/aurora-max.css` (`--aurora-max-*`) |
| TS shell tokens | `src/theme/auroraTokens.ts` (`AURORA_MAX_*`) |
| Primitives | `src/components/aurora-max/AuroraMaxPrimitives.tsx` |
| Route density frame | `src/components/aurora-max/AuroraMaxRouteFrame.tsx` |

Primitives: `AuroraMaxProductMark`, `AuroraMaxPanel`, `AuroraMaxEyebrow`, `AuroraMaxControl`, `AuroraMaxMetricStrip`, `AuroraMaxTruthBadge`, `AuroraMaxScoreBadge`, `AuroraMaxEvidenceLadder`, `AuroraMaxCommandHeader`, `AuroraMaxRankedWorkspace`, `AuroraMaxReceiptAction`, `AuroraMaxFallback`.

### Reference-only (do not import anatomy)

- HQ lab device-frame / Desktop-Mobile toggle
- Demo data (`DEMO_GAMES`) and fake export
- Local `UtilityButton` / `Spotlight` / `SlateQueue` / `ReceiptTray` inside `AuroraMax.tsx`
- Admin indigo tab chrome
- Hardcoded soft mint `#8bcda0` literals — prefer `--aurora-max-*` tokens

### Closest production twin (not HR)

`src/components/today/TodayFieldDesk.tsx` — real-data Field Desk using the same primitives. Useful interaction reference; not the HR product surface.

### Visual language (non-negotiable for V2)

- Sharp geometry (0 radius Max surfaces), diamond score badge
- Obsidian field + quiet emerald-lined panels + light grid
- Mono eyebrows; dense paper typography; restrained glow
- Truth vocabulary: confirmed / live / projected / warning / missing
- Evidence-first, field-desk density — not generic AI SaaS cards

---

## 4. HR V1 product architecture (reference)

### Single product, density-gated — not two apps

Free vs Pro today is primarily **Pro Mode** (`localStorage` / Zustand `useProMode`), not separate routes.

| Mode | Surfaces |
|---|---|
| Pro Mode Off (Free/standard) | Spotlight deck + Signal grid |
| Pro Mode On | Command Center, workspaces, Top Signal, Most Vouched, board/table/map |

Subscription tier gate that actually exists in HR UI: `ProResearchGate` around **12 Layers** in player profile. Open-beta (`FREE_BETA_ALL_ACCESS` default true) currently elevates tier access.

### Workspaces (Pro Mode)

| id | Label | View |
|---|---|---|
| `overview` | Overview / Research workspace | `OverviewView.tsx` |
| `edge` | Edge Desk | `EdgeDeskView.tsx` |
| `stacks` | Slate Stacks | `SlateStacksView.tsx` |
| `matrix` | Projection Matrix | `ProjectionMatrixView.tsx` |
| `extremes` | Extremes | `MatchupExtremesView.tsx` |

There is **no wired workspace named “Live Intelligence.”** Preserve live-slate + HR results grading instead of inventing a parallel live app from marketing copy.

### Data path (healthy — REUSE)

```
useDailyHrBoard → hrBoardQuery → HrBoardRepository
  → GET /api/mlb/hr-board/today|date/:date (compact=1)
  → parseHrBoardApiResponse → normalizeHrWatch → HrWatchRow

useHrResearch → GET /api/mlb/hr-board/player/:playerId
useHrResultsForDate → GET /api/mlb/hr-feed/today|date/:date
```

Backend anchors: `mlbHrBoardRoutes.ts`, `hrBoardHub.ts`, `hrPipeline` / `hr-engine`, `hrResearchSnapshotService`, `hrFeedService`, `hrBoardResponse.ts`.

---

## 5. Target V2 architecture (one product)

```
HR Intelligence V2
├── Aurora Max Shell (tokens + primitives + V2 layout CSS owned by V2)
├── Shared navigation (Free + Pro)
├── Read-model / adapter boundary (board, research, feed, vouch)
├── Entitlement boundary (capability flags — not forked apps)
├── Free capabilities (upgraded Standard board)
├── Pro capabilities (workspaces + advanced research)
├── Aurora intelligence surfaces
├── Research workflows
└── Live workflows (slate status + results grading)
```

### Proposed V2 module boundary (Phase 1+)

New isolated tree (illustrative — implement in Phase 1):

```
src/features/hr-intelligence-v2/
  shell/
  navigation/
  read-model/
  entitlements/
  free/
  pro/
  research/
  live/
  states/          # loading | empty | error | degraded
```

Rules:

- Do not import HR V1 presentation components into V2.
- May reuse domain types/contracts via a deliberate adapter layer.
- Prefer Aurora Max primitives over inventing a parallel card system.
- Cut over `hr_board` route to V2 only after gates pass; keep V1 until deletion phase.

---

## 6. Scroll ownership (critical)

### Current (V1) — problems to escape

| Layer | Owner | Risk |
|---|---|---|
| Primary vertical | `#inner-view-slot` via `FeedScrollProvider` + `feed.css` | HR is a guest of feed scroll CSS |
| HR page | `.hr-aurora-max.hr-deck` overflow-x only | Global `#inner-view-slot :is(.hr-aurora-max…)` overrides in `hr-aurora-max.css` |
| Player profile | Nested `overflow-y-auto` content + sidebar | Competing scrollers under fixed shell |
| Workspace switcher | Horizontal overflow | OK if deliberate |
| feed.css | `100dvh` + bottom padding on `#inner-view-slot` | Fights dense HR layouts |

HQ Aurora Max lab itself does **not** nest a vertical queue scroller; Today Field Desk does (`max-h` queue). V2 must choose deliberately.

### V2 scroll contract (Phase 1 requirement)

1. **One primary vertical scroll owner** for the HR Intelligence route (document explicitly in Phase 1).
2. No accidental nested vertical scrolling in the main board path.
3. Profile/research may use a modal/overlay with a single internal scroller — never stack body + pane + profile all scrolling.
4. Sticky chrome only where measured and necessary.
5. Horizontal overflow only for workspace tabs / dense tables on small screens.
6. No layout state mutations driven by normal scroll position.
7. Stable React keys by player/entity id — never index-based identity for board rows.

---

## 7. CSS / contamination boundaries

| Dependency | V2 stance |
|---|---|
| `styles/legacy/feed.css` | Do not make HR V2 layout depend on feed hacks |
| `features/hr/hr-aurora-max.css` | V1 atmosphere — not V2 foundation |
| `features/hr/hr-command.css` | V1 chrome |
| `styles/z8-hr-lens.css` (+ duplicate `z8-hr-lens 2.css`) | V1 tier/map — DELETE candidates after cutover |
| `styles/hr-profile.css` | V1 profile — REBUILD, then DELETE |
| `src/styles/aurora-max.css` | **REUSE** as shared Max contract |

---

## 8. Entitlement model for V2 (do not invent)

Preserve product intent discovered in code:

| Boundary | Mechanism today | V2 guidance |
|---|---|---|
| Standard vs full desk | Pro Mode toggle (`useProMode`) | One shell; capability packs Free vs Pro |
| 12 Layers research | `ProResearchGate` + `hasTierAccess` | Keep subscription-aware gate; respect beta flag |
| Board APIs | Public reads + rate limits | REUSE; no fake tier middleware |
| Staff debug/shadow | Auth + staff | Keep server-side only |

Free and Pro share architecture, navigation quality, cards, a11y, loading, and performance. Pro unlocks deeper intelligence — not a different-quality frontend.

---

## 9. Performance / rendering gates (carry into Phase 5)

Release blockers already specified by product:

- 10× bottom↔top stress scroll: no black/blank/chunk repaint/disappearing cards
- No scroll-triggered board/profile/Aurora/image/chunk storms
- Stable card identity; predictable DOM; no remount cascade
- Clean console
- Full-slate real data, not toy mocks

---

## 10. Phase sequencing reminder

| Phase | Outcome |
|---|---|
| 0 | This discovery set |
| 1 | Isolated V2 foundation + scroll ownership |
| 2 | Free experience + real data |
| 3 | Pro workspaces + research |
| 4 | Parity ledger completion |
| 5 | Performance hardening |
| 6 | Route cutover with rollback |
| 7 | Delete obsolete V1 presentation |

No Phase 1+ code until these ledgers are accepted as the working map.
