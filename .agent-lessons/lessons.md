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
---

id: L011
date: 2026-08-13
symptom: Account Profile still looked like generic white/10 glass because .profile-page was in aurora-max.css adapters but the live page never set that class
root_cause: Route-frame CSS targets a missing root class; Tailwind border-white/10 on the page also overrides the adapter
rule: When restyling a focused Aurora Max route, add the adapter class the shell already lists (profile-page, settings-page) and wrap cards in AuroraMaxPanel / --aurora-max-line — do not re-import aurora-max.css
applies_when: Restyling VouchEdge Profile, Settings, or any route already under .aurora-max-shell + AuroraMaxRouteFrame
status: active
---

id: L012
date: 2026-08-13
symptom: Iolaus PASS WITH ISSUES because untracked HomeRunIntelligencePageZ8.tsx made existsSync true in retirement contracts
root_cause: Retired Z8 page left on disk as untracked (plus .backup); contract tests check the filesystem, not git index
rule: After retiring HomeRunIntelligencePageZ8, delete the page and any .backup from disk. existsSync false is the contract. Untracked copies fail the same as committed ones. Do not restore Z8.
applies_when: HomeRunIntelligencePageZ8; hrAuroraMaxContract; hrAuroraMaxPageContract; Z8 retirement; untracked leftover
status: active
---

id: L013
date: 2026-08-13
symptom: Iolaus PASS WITH ISSUES after Z8 retirement because HomeRunIntelligencePageZ8.backup.tsx remained on disk; agents globbed *.tsx.backup only
root_cause: .gitignore src/**/*.backup*.tsx hides .backup.tsx from Cursor Glob; the live-src suffix is Name.backup.tsx not Name.tsx.backup. existsSync on the wrong suffix is a false all-clear
rule: When deleting retired Z8/page backups, find on disk (not Cursor Glob) for both Name.backup.tsx and Name.tsx.backup plus Name.backup. Gitignored files still fail existsSync. Do not restore the page.
applies_when: HomeRunIntelligencePageZ8; .backup.tsx; .tsx.backup; gitignore; Z8 retirement; hrAuroraMaxContract
status: active
---

id: L014
date: 2026-08-13
symptom: Profile page crashed in DEV with getSnapshot should be cached / Maximum update depth exceeded in ProfileShell (forceStoreRerender → updateStoreInstance)
root_cause: useAppSavedVouchIds selected state.savedVouches.map(v => v.id), so zustand getSnapshot allocated a new array every call; React 19 useSyncExternalStore Object.is saw a change and looped
rule: Never return a new object/array from a zustand selector. Wrap derived snapshots with useShallow, select a primitive, or subscribe to the store array and derive with useMemo.
applies_when: zustand useStore selector useSyncExternalStore getSnapshot ProfileShell useAppSavedVouchIds React 19 infinite loop
status: active
---

id: L015
date: 2026-08-13
symptom: Player Research Compare/Build printed invented Statcast zeros, batterScore 50, and ProTruthLensIntro advertised Splits / V.A.I Fit that do not exist
root_cause: CompareView read player.advanced and batterScore from empty registry shells (zeros / 50) instead of the Statcast map; Gemini interpolated advanced.hardHitPercent when advanced was {}; missing last-10 OPS was treated as cooling
rule: Aurora Max player desk must not render advanced zeros or batterScore 50; Compare/Build must use Statcast map + edge-research or UNKNOWN
applies_when: Player Research hub, Compare, Build, Statcast, edge-research, batterScore, Aurora Max player desk
status: active
---

id: L016
date: 2026-08-13
symptom: Aurora Max reduced-motion only set scroll-behavior, and Player Research nested a second .aurora-max-shell so the grid overlay painted twice
root_cause: Shared shell CSS treated reduce-motion as scroll only; route pages copied aurora-max-shell onto main even though AppShell already owns it
rule: On Aurora Max desks, reduced-motion must zero animation-duration and transition-duration on .aurora-max-shell. Do not nest .aurora-max-shell on a child route — keep the adapter class (player-research-hub) and inherit tokens from AppShell. Animate transform/opacity only; cap backdrop-filter at 18px; skip Lenis on app desks.
applies_when: Aurora Max CSS; player-research-hub; prefers-reduced-motion; nested aurora-max-shell; 60fps desk motion
status: active
---

id: L017
date: 2026-08-13
symptom: A Player Research BvP desk could print a 50 matchup rating or Statcast-looking numbers for a pair that has no fixture or live pitcher ID
root_cause: Mock matchups were treated as live evidence and unknown pairs were filled with default scores
rule: BvP numbers must come from a typed fixture (dataSource demo_fixture) or live edge-research; unknown pairs are partial/UNKNOWN — never invent matchupRating 50 or batter hitting metrics for P/SP/RP in the batter slot
applies_when: Player Research BvP mode, batter vs pitcher, position guard, demo fixtures, matchup rating
status: superseded
---

id: L018
date: 2026-08-13
symptom: BvP "Move to pitcher slot" cleared the batter and landed on an empty matchup; hub chrome still said Live roster / Statcast connected over demo numbers
root_cause: The CTA set batterId null, and Player Research header used registry/Statcast truth for every mode
rule: Pitcher-in-batter CTA must restore the last valid batter and fill the pitcher slot. BvP mode chrome must say demo fixture, not live Statcast. Do not advertise a Pitcher Matchup view that does not exist.
applies_when: Player Research BvP mode, pitcher-in-batter warning, hub truth badge
status: superseded
---

id: L019
date: 2026-08-13
symptom: BvP chrome still said demo fixture after the desk was wired to MLB Stats API + Savant, and a 50 matchup rating could still be invented when a pair had no live pitcher ID
root_cause: L017/L018 treated demo fixtures as the truth source. Live BvP uses GET /api/mlb/games/today, edge-research (batterVsPitcher + batter pitchMix), and pitcher-research (season + Savant arsenal). Fields not on those contracts (barrel% allowed, HR/9 vs L/R, run value, BvP hard-hit) must stay UNKNOWN. The pitcher-research route must be registered before /:playerId or the desk 404s.
rule: BvP numbers come from live edge-research and pitcher-research only — never invent matchupRating 50, batter metrics for P/SP/RP, or demo_fixture chrome. Hub BvP chrome is "official MLB Stats API + Savant" / "Live MLB feeds". Hero number is Career BvP OPS. Pitcher-in-batter CTA restores the last valid batter. Do not advertise a Pitcher Matchup view that does not exist.
applies_when: Player Research BvP mode, live MLB feeds, pitcher-research route, matchup rating, hub truth badge, position guard
status: superseded
---

id: L020
date: 2026-08-13
symptom: Live BvP 404ed on pitcher-research, /player_research showed marketing landing, and DET vs Messick auto-picked a Mets CF
root_cause: Express `tsx server.ts` does not reload new routes; `/player_research` canonicalizes to section `research` which was not in PUBLIC_SECTIONS; slate uses team abbreviations while the registry stores full names
rule: After adding an Express route, restart the custom server before claiming live 200s. Keep `research` in PUBLIC_SECTIONS if URLs alias to it. Match BvP auto-select on MLB_TEAM_OPTIONS name↔abbr, not `row.team === abbr`. Hub BvP badge is BVP_TRUTH_LABEL, not roster "Live MLB feeds".
applies_when: Player Research BvP, pitcher-research, /player_research, PUBLIC_SECTIONS, probable SP auto-select
status: active
---

id: L021
date: 2026-08-13
symptom: Converting HR Command Desk into an ad-hoc 3-column CSS card grid broke single-column virtualization, causing DOM saturation, repaint thrashing, and stutter/chunking on scroll
root_cause: Overconfident assurance that eager data equals 100% rendering safety. Converting a 1D virtualizer (@tanstack/react-virtual) into a multi-column CSS grid rendered all 30–60+ complex card DOM trees simultaneously without recycling.
rule: Never replace Aurora Max's proven single-column horizontal virtualized architecture (AuroraMaxRankedWorkspace) with ad-hoc multi-column CSS grids. Never give premature "100% safe" performance assurances without testing DOM node recycling. Strictly adhere to native Aurora Max horizontal telemetry patterns.
applies_when: HR Command Desk; Aurora Max; ChunkABoard; ChunkACard; list virtualization; CSS multi-column grids; performance assurances
status: active
---

id: L022
date: 2026-08-13
symptom: Daily Slate stayed stacked under the Aurora HQ tier board so the desk and the ranked queue competed on one page
root_cause: Agents treated Daily Slate as a workspace section on AuroraHqDesk instead of a peer Aurora route
rule: When Boyd separates a surface as its own Aurora page under the header, add a session-header tab plus a dedicated section id (aurora_daily_slate). Keep one sidebar Aurora HQ item. Do not leave the extracted surface stacked on the desk.
applies_when: VouchEdge Aurora HQ; Daily Slate; aurora_hr_hq; aurora_daily_slate; Aurora session header
status: active
---

id: L023
date: 2026-08-13
symptom: Optional @vercel/analytics lazy chunk failed and AppErrorBoundary replaced the entire Aurora desk with Stability Shield
root_cause: DeferredAnalytics/SpeedInsights sat inside the root error boundary, so a vendor fetch error looked like an app crash
rule: Optional telemetry must render inside a swallow-null boundary. A vendor chunk failure must not unmount the product desk.
applies_when: VouchEdge main.tsx; @vercel/analytics; SpeedInsights; AppErrorBoundary; Stability Shield; Aurora HQ
status: active
---

id: L024
date: 2026-08-14
symptom: HR Command Desk and Aurora HQ still waited on a MainViewRouter chunk; hr_v10 kept inner lazyWithRetry for ChunkABoard/KanbanView; AppShell only treated hr_max as an HR route
root_cause: Eager HR was implemented per-route instead of for the whole HR family, and V10 copied the Z8 inner-split pattern
rule: Every live HR section (hr_max, aurora_hr_hq, aurora_daily_slate, hr_v10) must be a static import in MainViewRouter, MainViewRouter must be static in AppShell, the id must be in EAGER_HR_SECTIONS, and the feature folder must contain no inner lazyWithRetry/React.lazy. Idle-defer ParlayOs, WorldChat, and DeployUpdateBanner on those routes behind a swallow-null boundary.
applies_when: Wiring VouchEdge HR routes, AppShell, MainViewRouter, routePreload, or hr-v2 board views
status: active
---

id: L025
date: 2026-08-14
symptom: Discord Open Beta wall said the guild owner was not a member, and local coding sessions hit the same wall whenever discord_guild_member was stale or false
root_cause: PUT guild member 204 (already in server) plus role-assign 403 was recorded as not-a-member; Discord never lets a bot assign roles to the guild owner. The UI gate also required both Discord flags and did not skip staff or Vite DEV, unlike requireAuth staff exemption.
rule: Treat Discord 204 + guild owner_id match as verified membership even when role assignment 403s. Frontend Discord wall must skip guests, staff/admin, and Vite DEV unless VITE_FORCE_DISCORD_BETA_GATE=true. Backend requireAuth must skip NODE_ENV=development unless DISCORD_FORCE_BETA_GATE=true. Never Boolean() Discord flags without preserving current when /api/auth/me omits them.
applies_when: VouchEdge Discord Open Beta; discord_guild_member; discord_beta_access; AuthenticatedApp Discord verification; requireAuth; guild owner; interpretGuildMemberResult
status: superseded
---

id: L026
date: 2026-08-14
symptom: Discord Open Beta still said the guild owner was not a member after the owner_id patch
root_cause: PUT Add Guild Member 204 already means the user is in the server; treating a follow-up role 403 as not-a-member (or requiring GET guild owner_id) fail-closes when owner lookup is null. Settings also kept stale discord_guild_member=false until a manual retry, and the founder email was not exempt on requireAuth.
rule: Treat Discord 204 (already a member) as verified membership even when role assignment 403s or 500s. Persist both flags, bumpAuthUserEpoch, and auto-retry join on bootstrap. Skip the wall for founder email on UI and requireAuth. Never gate membership on GET /guilds owner_id.
applies_when: VouchEdge Discord Open Beta; interpretGuildMemberResult; already_member; discord_guild_member; requireAuth; founder email; retry-join
status: active
---

id: L027
date: 2026-08-14
symptom: HR board fallback fired dozens of statsapi.mlb.com /people/mlbapi_NNNNN/stats 400s
root_cause: toMLBPlayerStub ids are mlbapi_${numericId}; mlbDirect fetchHitterStats interpolated that stub into the Stats API path, which only accepts numeric person ids
rule: Resolve mlbapi_ / headshot / numeric ids with resolveMlbPersonId before any Stats API /people/{id} call. Skip the fetch when resolve returns null. Never interpolate roster stub ids into MLB URLs.
applies_when: mlbDirect; fetchHitterStats; mlbapi_; statsapi.mlb.com; HR board fallback
status: active
---

id: L028
date: 2026-08-14
symptom: HR board showed no API data after Stats API 400s were fixed; /api/mlb/hr-board/today 503d and fallback rows vanished
root_cause: Fallback rows used mlbapi_ stub ids; parseHrBoardApiResponse hasPlayerIdentity did Number(playerId) which is NaN so every fallback row was dropped. Backend MLB fetches also 500/503 in milliseconds when Node cannot reach statsapi (sandboxed server / open circuit).
rule: HR board wire playerId must be a numeric MLB person id (resolveMlbPersonId). Never drop mlbapi_ stubs in hasPlayerIdentity. If /api/mlb/* 500s in a few ms, check outbound Stats API from the Node process and the MLB circuit breaker, not the React page.
applies_when: HR board empty; hrBoardApiContract; mlbapi_; /api/mlb/hr-board/today 503; sportsFetchJson; circuitBreaker
status: active
---

id: L029
date: 2026-08-14
symptom: HR Max cards stacked on top of each other so Receipt and other row actions could not be clicked
root_cause: @tanstack/react-virtual placed rows with position:absolute at estimateSize (160px cards / 56px queue) without measureElement; real cards and open receipt trays are taller, so the next row painted over the controls. HrScrollReveal content-visibility + containIntrinsicSize 160px locked the same fake height.
rule: Virtualized variable-height rows must set data-index, ref={virtualizer.measureElement}, and remasure when a row expands (receipt). Never pair a virtualizer with containIntrinsicSize or a transform reveal that disagrees with estimateSize. Do not use estimateSize as layout truth.
applies_when: hr-max; useVirtualizer; HrMaxCardBoard; HrMaxSlateQueue; receipt tray; overlapping click targets
status: active
---

id: L030
date: 2026-08-15
symptom: Agents rebuilt or planned a What’s Changed / poll-diff feed on Today or hr_max after Boyd asked it gone
root_cause: The Today page had TodayChangeDigest (“What changed”) and a later cockpit spec re-advertised a signal console
rule: Do not render What’s Changed on Today. TodayChangeDigest, useTodayChangeDigest, and todayChangeDigestModel are deleted. Do not add HrMaxSignalConsole or a poll-diff strip on hr_max unless Boyd explicitly restores it.
applies_when: Today dashboard; hr_max Command Desk; What changed; change digest; signal console
status: active
---

id: L031
date: 2026-08-15
symptom: HR Max virtualizer first-painted rows at a flat 220/72px so an open receipt still overlapped until measureElement ran
root_cause: estimateSize ignored known state (receiptOpen, evidence count) and treated all rows as the same closed height
rule: estimateSize must be a function of known desk data (receiptOpen, evidenceCount). measureElement still corrects wrap. Prefer a slightly tall first guess over a short one.
applies_when: hr-max; estimateDeskRowSize; useVirtualizer estimateSize; receipt tray
status: active
---

id: L032
date: 2026-08-15
symptom: Exclusive mobile Elite tabs showed (0) on Strong/Watch because chip counts used filtered stats, and ticket "why" copy was specified as invented Statcast (Barrel%/wind)
root_cause: selectedTiers filters the same rows that fed vm.stats; the mobile blueprint used flavor-text catalysts that are not on HrWatchRow
rule: Ticket catalyst is the strongest of the first three mapped evidence layers or row.signal — never invent Barrel%, wind, or EDT. Mobile exclusive-tier chips must use poolStats (search-filtered, not tier-filtered).
applies_when: hr-max tactical ticket; presentHrMaxTicket; onFocusTier; poolStats; HRPI catalyst; mobile tier switcher
status: active
---

id: L033
date: 2026-08-15
symptom: Using TanStack useWindowVirtualizer for HR Max Cards would freeze the window at scrollY 0 or mount every card on desktop
root_cause: feed.css at min-width 1181px sets html/body/#root overflow hidden and makes #inner-view-slot the page scroller; body overflow-y scroll is the scroller below that
rule: Attach Cards useVirtualizer to useFeedScrollRoot() when #inner-view-slot is a constrained overflow pane, else document.body/documentElement. Never useWindowVirtualizer on VouchEdge. Keep mobile inner column max-h. Keep 4×1D virtualizers (L021) and measureElement (L029).
applies_when: hr-max; HrMaxCardBoard; useWindowVirtualizer; #inner-view-slot; FeedScrollContext; page-scroll virtualization
status: active
---

id: L034
date: 2026-08-15
symptom: HR Intelligence Command Desk V10 kept disconnecting from the MLB API and flashing mock Judge/Ohtani slates
root_cause: useHrSlateFeed fetched statsapi.mlb.com from the browser with one 6s AbortController covering schedule plus every team roster, then returned mockChunkAData on abort
rule: hr-v2 / V10 must use hrBoardQueryOptions (queryKeys.hrBoard) and /api/mlb/hr-board/today like hr_max. Never browser-fetch statsapi for the desk. Never use mockChunkAData as the live feed. Map HrWatchRow; show UNKNOWN for xSLG/Barrel/wind when absent.
applies_when: HR Intelligence Command Desk V10; hr-v2; useHrSlateFeed; mlbLiveService; statsapi.mlb.com; mockChunkAData
status: active
---

id: L035
date: 2026-08-15
symptom: HR Intelligence V10 looked empty before official lineups posted even though /api/mlb/hr-board/today returned a projection_preview pool
root_cause: ve_hr_v10_startersOnly defaults to true and dropped every row whose lineupStatus was not confirmed_starter; projected_unconfirmed maps to roster. Snapshot capture and v2 INVALID were the wrong layer.
rule: When confirmed starter count is 0 and the mapped slate has rows, show the projected pool with the Z8 preview banner. Never invent Avg Odds/EV (280 / 55.0); print UNKNOWN when book odds are absent.
applies_when: HrIntelligencePageV10; resolveStartersOnlyFilter; startersOnly; projection_preview; hr-board/today
status: active
---

id: L036
date: 2026-08-15
symptom: Original HR Intelligence Pro Mode toggle existed in the header but hr_board never passed onToggleProMode, so Standard spotlight/grid and Pro workspaces were dead code
root_cause: Aurora Max restyle of HomeRunIntelligencePageLegacy dropped Pro wiring while leaving useProMode, HrProModeToggle, HrSpotlightDeck, HrSignalGrid, and WorkspaceSwitcher unused
rule: When restoring or editing live hr_board, wire useProMode into HrHeader. Standard mounts spotlight+signal grid; Pro mounts WorkspaceSwitcher plus the original suite. Do not recreate HomeRunIntelligencePageZ8.tsx. Do not inner-lazy the Pro modules on this eager route.
applies_when: VouchEdge Home Run Intelligence; hr_board; Pro Mode; HrSpotlightDeck; WorkspaceSwitcher
status: active
