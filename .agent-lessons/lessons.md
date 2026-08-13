# Agent lessons

Schema: id | date | symptom | root_cause | rule | applies_when | status(active|superseded)

Do not invent past lessons. Curate: supersede stale; merge dupes; only durable mistakes.

id: L001
date: 2026-08-13
symptom: Recreating a heavy route by restyling the old page reintroduced chunk races and pulled Command Center / workspace / spreadsheet into first paint
root_cause: The old Home Run Intelligence page lazy-splits many Pro modules that still compete with the board request; copying it copies the failure
rule: Ship a separate Aurora Max desk route that statically composes a small command-desk chunk and reads the existing HR board view model; never import HomeRunIntelligencePageZ8 into the new page
applies_when: Building a replacement research surface for VouchEdge HR Intelligence
status: active
---

id: L002
date: 2026-08-13
symptom: Feature-folder presenter next to hr-max used ../../hr/... and Vite could not resolve the board hook helpers
root_cause: src/features/hr-intel-v2/presentWatchRow.ts is a sibling of src/features/hr/, so one ../ reaches hr; components/ needs ../../hr
rule: From a feature-root file under src/features/<name>/, import the HR board as ../hr/...; only files in src/features/<name>/components/ use ../../hr/...
applies_when: Adding a new VouchEdge feature folder that reads useHrBoardViewModel or hrDecisionBrief
status: active
---

id: L003
date: 2026-08-13
symptom: New HR Intelligence page shipped as a ranked queue and looked unfinished against the live board
root_cause: Style reference (Command Desk) was treated as the feature map; Home Run Intelligence’s first surface is the four Elite/Strong/Watch/Sleepers card columns
rule: When porting HR Intelligence, open HomeRunIntelligencePageZ8 and HrBoard before each feature. The first page must include the four-tier card board (Power/Pitcher/Park, Research, Slip, receipts). Command Desk is tone only.
applies_when: Building or revising VouchEdge HR Intelligence presentation pages
status: superseded
---

id: L004
date: 2026-08-13
symptom: HR Intelligence still showed chunk-load / full-page recovery while using the new Aurora Max pages
root_cause: Today/Feed idle-warmed hr_board (Z8), and Vite HMR preload errors were treated as deploy skew so chunkRecovery reloaded the tab
rule: Never preload or neighbor-warm HomeRunIntelligencePageZ8. In DEV, ignore vite:preloadError — only auto-recover chunk failures in production
applies_when: Wiring HR routes, routePreload neighbors, or chunkRecovery listeners
status: active
---

id: L005
date: 2026-08-13
symptom: Dual-Conductor audits can PASS HR / Aurora Max routes that still race inner lazy splits against first paint or recover via ChunkLoadError
root_cause: Z8's 8-way Command Center / workspace / spreadsheet / profile lazyWithRetry graph competes with the board request; copying HomeRunIntelligencePageZ8, hover-preloading hr_board from hr_intel_v2/hr_max, or treating vite:preloadError recovery as architecture reintroduces the race. Project L001 is a build rule only; Iolaus had no FAIL-closed kill criterion.
rule: Iolaus Dual-Conductor audits FAIL-close on any chunk loading issue. FAIL if a new/changed page uses inner lazyWithRetry/React.lazy splits that compete with first paint or the board request (Z8's 8-way pattern). FAIL if a route copies or imports HomeRunIntelligencePageZ8 into a new page. FAIL if hover/idle preload (routePreload.ts, AppNav, FeedSidebar, CmdK) fires heavy neighbor chunks (hr_board 8-way split) while the user is on hr_intel_v2 or hr_max. FAIL if vite:preloadError / ChunkLoadError / Failed to fetch dynamically imported module recovery is used as a substitute for a clean single-chunk first paint. PASS only with grep of the feature folder for lazyWithRetry|React.lazy and preferably a production build showing one page chunk for the new route (no inner 8-way). Code-only claims without grep/build are not enough to PASS. Complements L001 (do not copy Z8 when building).
applies_when: Iolaus Dual-Conductor audit; HR Intelligence; Aurora Max; hr_intel_v2; hr_max; lazyWithRetry; React.lazy; routePreload; ChunkLoadError; vite:preloadError; HomeRunIntelligencePageZ8
status: active
---

id: L006
date: 2026-08-13
symptom: Agents kept shipping or navigating to HomeRunIntelligencePageZ8 after Boyd retired it, leaving a second HR Intelligence item or a dead route
root_cause: Z8 was the live Home Run Intelligence page; bookmarks used /hr-board, hr_board, and daily_hr_watch_new. The replacement is Aurora Max HR Intelligence (hr_intel_v2), not a stub and not hr_max
rule: Z8 is gone. Never recreate HomeRunIntelligencePageZ8 or a Flame "Home Run Intelligence" feature. Old URLs/ids /hr-board, /daily-hr-watch-new, hr_board, daily_hr_watch_new must canonicalize to hr_intel_v2 (Aurora Max desk). Keep hr_max as its own Command Desk. One sidebar HR Intelligence entry
applies_when: VouchEdge HR Intelligence; hr_intel_v2; hr_board; /hr-board; HomeRunIntelligencePageZ8; daily_hr_watch_new; featureConfig; sectionNavigation
status: active
---

id: L007
date: 2026-08-13
symptom: Boyd rejected static-importing or restyling the same HR Intel v2 cards to kill chunk loading
root_cause: Agents treated “no chunks” as keep IntelV2PlayerCard / copied card chrome and only change the route loader
rule: When Boyd says delete the cards and don’t use the same code, delete the module. New file, new export name, new markup and CSS identifiers. Do not paste IntelV2PlayerCard, Z8 CompactPlayerCard, or HrMax desk cards back. Keep the four-tier board feature map and useHrBoardViewModel.
applies_when: VouchEdge HR Intelligence presentation; hr-intel-v2 tiles/cards; chunk-loading vs recode
status: active
---

id: L008
date: 2026-08-13
symptom: After HR pages were static in MainViewRouter, HR Intelligence still looked like it had chunk-loading leftovers
root_cause: AppNav/CmdK/FeedSidebar still called preloadSection for hr_max/hr_intel_v2, hrBoardQuery dynamically imported the loader, and AppShell mounted ParlayOsLayer (and unsuspended CmdK) on HR first paint
rule: Eager HR routes (hr_intel_v2, hr_max) must never be prefetched. Keep pages and useHrBoardViewModel/hrBoardLoader static. Idle-defer AppShell ParlayOsLayer on those routes. Wrap CmdK lazy in its own Suspense so it cannot replace the HR skeleton.
applies_when: Wiring HR Intelligence / HR Command Desk navigation, preload, AppShell chrome, or board data loaders
status: active
---

id: L009
date: 2026-08-13
symptom: HRPI-v4 research brief uses 35/25/20/10/10; agents printed that as the live score formula
root_cause: The Grok HRPI-v4 prompt weights are a research grouping, not vouchres SIGNAL_WEIGHTS (35/35/15/15 power/pitcher/park/weather)
rule: Present published hrScore as HRPI. Model card must state live pipeline 35/35/15/15 and label 35/25/20/10/10 as methodology copy not applied client-side. Never invent xSLG, Barrel%, wind, humidity, or HR/9 — mark those missing/UNKNOWN when absent from HrWatchRow.
applies_when: VouchEdge HR Intelligence presentation; hr-intel-v2 presentWatchRow; HRPI-v4 ladder copy
status: active
---

id: L010
date: 2026-08-13
symptom: Agents still built or routed to HR Intelligence v2 after Boyd deleted it
root_cause: Project lessons L006 still pointed retired URLs at hr_intel_v2; the page folder was live in the tree
rule: hr_intel_v2 / /hr-intel-v2 is removed. Do not recreate src/features/hr-intel-v2. Canonicalize /hr-board, hr_board, daily_hr_watch_new, and /hr-intel-v2 to hr_max. Keep hr_max. Z8 stays deleted.
applies_when: VouchEdge HR routes; featureConfig; sectionNavigation; hr_max; hr_intel_v2
status: active
