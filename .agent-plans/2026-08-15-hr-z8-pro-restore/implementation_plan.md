# Restore HR Intelligence Pro (original z8 suite) Implementation Plan

Status: DONE
Slug: 2026-08-15-hr-z8-pro-restore
Repo: /Users/boydsantos/Desktop/Projects/Vouch/vouchres
Mode: FULL
CONTEXT_STAMP: 2026-08-15 (session date). Memory MCP: EMPTY. ADR store: EMPTY. Lessons: L001, L005, L006, L009, L010 (cited below). Stamp is when-checks-ran, not fresh web data.

## Goal

Live `hr_board` (sidebar **Home Run Intelligence**) gets the original Standard/Pro switch back, with the suite that came with it. Standard is four spotlight cards + the stripped signal grid. Pro is the original analytics suite: workspace tabs (Overview, Edge Desk, Slate Stacks, Projection Matrix, Extremes), command-center filters, cards/table/map, top signal, most-vouched, player research. Same `useHrBoardViewModel` / `HrWatchRow` board. No V10, no new Statcast, no second sidebar item.

## Root cause

Pro Mode already exists (`useProMode`, `HrProModeToggle`, `HrHeader` props) but `HomeRunIntelligencePageLegacy` never passes `onToggleProMode`, so the switch is hidden. Spotlight, signal grid, and five workspaces are live modules that the page no longer mounts.

## Lesson conflict (named, not ignored)

| Lesson | Says | This plan |
|---|---|---|
| L006 / L010 | Do not recreate `HomeRunIntelligencePageZ8.tsx`; send `hr_board` to `hr_max` | **Honor filename.** Do not recreate `HomeRunIntelligencePageZ8.tsx`. **Boyd’s ask supersedes “canonicalize to hr_max”** for the main HR Intelligence entry: keep `hr_board` → Legacy as the one sidebar item. `hr_max` stays its own Command Desk. |
| L001 / L005 | No inner `lazyWithRetry` / 8-way first-paint split | Static imports only. `hr_board` is already eager. Do not lazy-split Pro workspaces. |
| L009 | No invented xSLG / Barrel% / wind | Existing workspace views already null-guard `HrWatchRow`. No new copy. |

## Craft brief

**Product / surface:** web — `hr_board` Home Run Intelligence  
**Thesis:** Standard is four receipted spotlight cards and a quiet grid; Pro is the original workspace suite behind one header switch.  
**Primary artifact:** header **Pro mode** switch that actually changes the page (not a dead control).  
**Brand in first viewport:** existing “Home Run Intelligence · MLB Signal Deck” mark.  
**Motion beats:** (1) switch thumb; (2) Standard↔Pro layout swap; (3) workspace tab inset.  
**Reduce-motion path:** existing duration-200 only; no shimmer / marquee.  
**Color / material:** keep current Aurora Max + `z8-hr-lens.css` on this page (contract tests retired the Z8 filename, not the lens).  
**Typography:** existing deck / mono tabular scores.  
**Non-goals:** recreate `HomeRunIntelligencePageZ8.tsx`; make V10 the default; inner lazy splits; invented Statcast; second Flame nav item.  
**Designer:** existing HR modules (not Apex marketing).  
**Acceptance:** toggle visible; Standard vs Pro layouts; screenshot or live `/hr_board`.

## In scope

- Wire `useProMode()` into `HomeRunIntelligencePageLegacy`.
- Pass `isProMode` / `onToggleProMode` / `onProModeIntent` (`preloadSection('player_edge_lab')` only — not `hr_board` self-preload, L004/L008).
- **Standard (default, `vouchedge_hr_pro_mode !== 'true'`):** `HrHeader` + `HrSpotlightDeck` + `HrSignalGrid`. No command-center filter stack, no workspace switcher, no four-tier board.
- **Pro:** `HrHeader` + `HrCommandCenter` + `WorkspaceSwitcher` + `WorkspaceRenderer`. Overview children = current top-signal + most-vouched + cards/table/map. Other tabs = existing Edge/Stacks/Matrix/Extremes views.
- Persist workspace tab in `vouchedge_hr_workspace` (localStorage), default `overview`.
- Tests on the live page: toggle present; Standard hides board columns; Pro shows workspace nav.

## Out of scope

- Recreating `src/features/hr/pages/HomeRunIntelligencePageZ8.tsx` (tests + L006).
- Changing `hr_v10` / `hr_max` / `aurora_hr_hq` routing.
- New Statcast fields, mock slates, canvases.
- Inner `React.lazy` of Pro modules.
- Billing gate on the desk toggle (original was a local Standard/Pro density switch; entitlements stay on Pro Labs routes).

## Files

- `src/features/hr/pages/HomeRunIntelligencePageLegacy.tsx` — compose Standard vs Pro
- `tests/hrLegacyPage.test.tsx` — toggle + layout contract
- `src/features/hr/components/Header/HrHeader.tsx` — no change unless a prop is missing (already has Pro props)
- `src/features/hr/hooks/useProMode.ts` — read only
- Existing: `HrSpotlightDeck`, `HrSignalGrid`, `WorkspaceSwitcher`, `WorkspaceRenderer`, workspace views — mount, do not rewrite

## Risks

- Eager `hr_board` chunk grows because Pro views are static (accepted vs L005 inner-lazy FAIL).
- Extremes/Matrix copy must stay bound to `HrWatchRow` or UNKNOWN (L009). No new strings.
- Admin lab bar stays; not a second public HR Intelligence entry.

## Effort

Workers: 0  
Iolaus: after diff (required — HR UI)

## Phases

1. Wire Pro toggle + Standard layout (spotlight + grid).
2. Wire Pro layout (workspaces + existing board/table/map).
3. Tests + typecheck. Visual receipt on `/hr_board`.

> [!IMPORTANT]
> **User Review Required**
>
> Reply **approve** (or lock it / go / execute) to start.
> Reply with changes to revise. I will not edit the product until you approve.
