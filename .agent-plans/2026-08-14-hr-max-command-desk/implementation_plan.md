# HR Max Command Desk cockpit Implementation Plan

Status: WAITING_APPROVAL
Slug: 2026-08-14-hr-max-command-desk
Repo: /Users/boydsantos/Desktop/Projects/Vouch/vouchres
Mode: FULL
CONTEXT_STAMP: 2026-08-15T02:55:09Z (preflight env FAIL on missing `.env` / `.env.test` copies; node/git/deps PASS. Stamp is when-checks-ran, not fresh web data.)

This is **not** `2026-08-14-hr-max-perf` Phase 4 (queue/cards/table are already virtualized). This is **not** `2026-08-14-hr-max-receipt-export` (still WAITING_APPROVAL). Export checksum copy stays on that plan.

## Goal

Turn live `hr_max` (HR Command Desk) from a stacked scrolling page into a viewport-locked two-pane cockpit: lead receipt left, ranked slate right, saved-row decision dock at the bottom. No What’s Changed / signal strip. Every badge maps to a typed field or reads unavailable.

## Why the pasted spec is rejected as-written

| Pasted piece | Product truth |
|---|---|
| 5-layer Statcast ladder (Barrel%, xwOBA vs pitch, humidity/wind mph, “Guaranteed 4+ PA”) | Not on `HrWatchRow`. L009 / L015. Live ladder is qualitative 0–100: Hitter power, Pitcher matchup, Park environment, Recent contact, Lineup certainty (`mapHrWatchToDesk.ts`). |
| `Time TBD` → inning clock from the HR board row | Compact `GET /api/mlb/hr-board/today?compact=1` omits `gameTime` / `gameStatus`. Pipeline scored candidate also does not serialize `gameDate`. SpotlightDeck falls back to `'TBD'`. Honest clock = add `gameDate` to the candidate + join `useLiveGames` (`LiveGameCard.id` = `gamePk`) for live/final. |
| Inline 9-man batting order drawer | Board is ranked HR candidates, not a boxscore 9. Compact has `battingOrder`; `normalizeHrWatch` drops it. Expanding a row may show **board hitters in this `gamePk`**, labeled as such — never “9-man batting order” unless a lineup endpoint is joined (out of scope unless you expand). |
| Tabbed What’s Changed / signal console | Removed from Today 2026-08-14 (`TodayChangeDigest` deleted). Do not rebuild on Today or hr_max. |
| `/api/signals/stream` SSE + optimistic HRPI + 8-bit chime | No SSE route. Board already refetches via React Query (`hrBoardQueryOptions.refetchInterval`). SSE is a new backend until polling fails a named mode. Chime is Cognitive-Unsafe on a data desk unless user-opt-in and `prefers-reduced-motion` skips it — default **off / out of scope**. |
| SHA-256 “cryptographic verification stamp” / Trust Ledger / ZHAVIOR Brier `.142` | Same FAIL as receipt-export plan. Checksum ≠ signature. No HR-desk Brier. `useHrResultsForDate` can grade **hit / no-hr / inconclusive** when a game is Final. |
| Shimmer scanline utility | Apple craft `KILL:COGNITIVE_UNSAFE_DESK`. Do not ship. |
| Heap &lt; 60MB / 60fps | Unmeasured. `UNKNOWN`. Do not claim. |
| New Zustand ResearchSlipDrawer | `savedMap` reducer + `openParlayAdd` already exist. Dock those. New store only if localStorage persist is approved (L014: no new-array zustand selectors). |

## Craft brief

**Product / surface:** web — `hr_max` Command Desk  
**Thesis:** Quiet tactical cockpit; one lead batter owns the left third; the ranked slate never leaves the right viewport; chrome explains freshness, never spectacle.  
**Primary artifact:** two-pane desk with monospace HRPI + a reserved-width game-status clock.  
**Brand in first viewport:** Aurora Max emerald hairlines + existing product mark in the session bar.  
**Motion beats:** (1) live-status dot opacity pulse only while `isLive` and motion allowed; (2) receipt tray height change measured by virtualizer; (3) dock expand/collapse.  
**Reduce-motion path:** no pulse, no glow blur (existing `.hr-max-desk__glow { display: none }`), zero animation-duration on desk (L016).  
**Color / material:** existing `--aurora-max-*` tokens. Do not add a second `:root` desk palette that fights the shell.  
**Typography:** JetBrains / SF Mono tabular for HRPI, clocks, ranks; body stays Aurora paper.  
**Non-goals:** neon scanlines, marquee tickers, fake Statcast, advertised unbuilt tabs, CSS multi-column card grids (L021).  
**Designer:** elite-ui-architect layout + existing Aurora primitives (not Apex marketing).  
**Acceptance:** apple-craft-director rubric after a screenshot or live URL.

## Layout SIR (before CSS)

```json
{
  "id": "hr-max-cockpit",
  "display": "grid",
  "gridTemplateRows": "auto minmax(0,1fr) auto",
  "minHeight": "calc(100dvh - app-shell)",
  "overflow": "hidden",
  "children": [
    { "id": "status-bar", "display": "flex", "height": "2.5rem", "gap": "0.75rem", "overflow": "hidden", "font": "mono tabular" },
    {
      "id": "split",
      "display": "grid",
      "gridTemplateColumns": "minmax(17.5rem, 0.88fr) minmax(0, 1.12fr)",
      "gap": "0.75rem",
      "minHeight": 0,
      "children": [
        { "id": "left", "display": "flex", "flexDirection": "column", "gap": "0.75rem", "minHeight": 0, "overflow": "auto" },
        { "id": "right", "display": "flex", "flexDirection": "column", "minHeight": 0, "overflow": "hidden" }
      ]
    },
    { "id": "dock", "minHeight": "2.75rem" }
  ]
}
```

Narrow viewport: `split` becomes one column (left then right). Virtualizer rows keep `position: absolute` (L029 exception). No other absolute document flow.

## In scope

### Phase 1 — Zero-CLS cockpit + honest game clock

- CSS grid lock on `.hr-max-desk` / `__body` (drop `max-width: 1240px` stacked column as the only layout).
- Fold `HrMaxSpotlightDeck` 4-up grid out of the stacked body (it fights the cockpit and L021). Lead receipt is `HrMaxSpotlight` for `activeRow` only.
- Serialize `gameDate` (ISO first pitch from pool `game.gameDate`) and `gameStatus` (schedule status string already used as `game.status` on the edge-engine path) onto the validated pipeline candidate; add `gameDate`, `gameStatus`, `opponentPitcherHand` to `COMPACT_CANDIDATE_FIELDS`.
- Map through `normalizeHrWatch` → `HrWatchRow` → `HrMaxDeskRow`: `gameTime`, `gameStatus`, `lineupSpot` (from `battingOrder` / 100 when official, else null — never invent spot 9), `pitcherHand`.
- Join `useLiveGames()` by `String(gamePk) === LiveGameCard.id`. Clock badge states:
  - Final: `FINAL {awayScore}-{homeScore}` when both scores are numbers; else `FINAL` + status text.
  - Live: `liveStateLabel` if present, else `● {half} {inning}` when inning is non-null, else status text. Missing outs stay omitted (schedule path often has `outs: null`).
  - Upcoming: locale time from `gameDate` / `LiveGameCard.gameDate`.
  - Else: `Time unavailable` — never `TBD`.
- Status strip: date, sources freshness (existing), matchup count (`slate.gameCount`), confirmed count, **live / final counts from unique joined `gamePk`s** — not invented 5/9.
- Spotlight matchup vector: pitcher name + hand if present; venue; park layer score; weather **0–100 index** if non-null. No °F / wind mph.
- Evidence ladder keeps current five board layers. Optional `detail` from existing `reasons[0]` / `lineupLabel` only. Primary `[+ Add to Slip]` = `openParlayAdd`. Secondary = existing receipt tray (`toggleReceipt`), labeled **Research receipt** not Full Dossier/Statcast.
- Queue clock column uses the same badge. Reserved min-width + `tabular-nums` so live↔final swaps do not shift the row.
- Fix table workspace subtitle (“Statcast Telemetry… exit velocity…”) — that copy is already unsourced.
- Audit strip: among visible rows whose joined game `isFinal`, count `getHrResult` hit / no-hr; remaining finals without a result = void. In-progress = not graded. No Brier number unless `hrProbability` is present on every graded row **and** we compute it in a tested helper — otherwise omit Brier.

### Phase 2 — cancelled

What’s Changed is out of scope. Deleted from Today (`TodayChangeDigest`, hook, model). Do not add `HrMaxSignalConsole`.

### Phase 3 — Decision dock

- Sticky dock from existing `savedMap` + visible row lookup. Expand lists saved names, HRPI, opponent, pitcher.
- Correlation: warn when two saved rows share `team`. Do **not** warn on “high-K starter” or “under 60°F / in-blowing wind” — those fields are not on the desk row.
- Export Discord markdown / CSV / JSON of **saved rows’ mapped fields**. SHA-256 checksum only by calling `exportDeskReceipts` if that plan is approved; label **integrity checksum**, never cryptographic verification.
- Post-game: show hit/no-hr from `getHrResult` on saved rows whose game is Final. No ZHAVIOR ledger hook.

## Out of scope

- `/api/signals/stream`, EventSource, Next.js Server Actions.
- Invented Statcast / wind vector / humidity / arsenal xwOBA / guaranteed PA.
- Official 9-man boxscore drawer (unless you explicitly expand to join lineup/matchup API).
- What’s Changed / poll-diff signal console on Today or hr_max (removed 2026-08-14).
- New Zustand slip store (unless you ask to persist `savedMap`).
- Ambient shimmer, audio chime, heap/FPS claims.
- Recreating Z8 / `hr_intel_v2` (L006 / L010). Inner `React.lazy` on this route (L005 / L024).
- Perf plan Phase 2–3 desk splits (still blocked on that plan’s confirm) except insofar as this layout already isolates left/right/dock.
- Receipt-export serializer files unless you approve that plan in the same message.

## Files

- `server/services/mlb/hrPipeline.ts` — add `gameDate` / `gameStatus` on scored candidate from pool game
- `server/routes/mlbHrBoardRoutes.ts` — compact field allowlist
- `src/features/hr/types/hrWatch.ts` — optional `gameStatus`, `lineupSpot`, `pitcherHand`
- `src/features/hr/utils/normalizeHrWatch.ts` — map compact/full fields; stop dropping batting order
- `src/features/hr-max/mapHrWatchToDesk.ts` — clock + spot fields; no TBD
- `src/features/hr-max/liveGameClock.ts` — pure join + badge model
- `src/features/hr-max/deskAudit.ts` — W/L/V from `getHrResult` + Final join
- `src/features/hr-max/hr-max-desk.css` — cockpit grid, reserved clock width, reduce-motion
- `src/features/hr-max/components/HrMaxDesk.tsx` — compose split + liveGames + snapshot
- `src/features/hr-max/components/HrMaxSidecar.tsx` — left pane only
- `src/features/hr-max/components/HrMaxSpotlight.tsx` — vector + ladder + slip/receipt
- `src/features/hr-max/components/HrMaxSpotlightDeck.tsx` — remove from stacked cockpit (keep file only if still used)
- `src/features/hr-max/components/HrMaxMainPane.tsx` — right pane; honest table subtitle
- `src/features/hr-max/components/HrMaxSlateQueue.tsx` — clock badge; optional same-game board-hitter expand
- `src/features/hr-max/components/HrMaxStatusBar.tsx` — live/final counts
- `src/features/hr-max/components/HrMaxGameClock.tsx` — badge
- `src/features/hr-max/components/HrMaxDecisionDock.tsx` — Phase 3
- `tests/hrMaxGameClock.test.ts`
- `tests/hrMaxDeskAudit.test.ts`
- `tests/mapHrWatchToDesk.test.ts` — extend
- `tests/hrAuroraMaxPage.test.tsx` / contract tests — clock unavailable, no TBD, no Statcast subtitle

## Risks

- Compact allowlist growth vs payload size — only the four missing clock/hand/date fields, not the full row.
- `lineupSpotFromBattingOrder` returning 9 when battingOrder is missing is engine-side; UI must show **unavailable**, not `#9`.
- Joining live games adds a second poll (12s when live). Enable only on `hr_max` + `isToday`. Do not prefetch from other routes (L008).
- Uncommitted perf diffs on CardBoard / Queue / Table / `hrBoardQuery.ts` — do not revert `measureElement`.
- Env doctor FAIL: do not claim production 200s from this session until `.env` exists. Typecheck/tests still run.
- CSS grid on the **page** is not a multi-column **card** virtualizer (L021). Queue stays 1D virtualized.

## Lessons / memory

- Project: L009, L015, L016, L021, L024, L029 (and L001/L005 no Z8). Desktop search for this slug: EMPTY. claude-mem MCP: EMPTY (server not in this session). ADR store: EMPTY.
- OSS: `fail-closed-receipts` — screenshot/live URL before UI done.

## Effort

Workers: 0 until approved  
Iolaus: after Phase 1 UI (required for HR)  
Chronos: `UNKNOWN — no diagnose` this turn (no live URL). Run CLI after a running preview, never `repair --apply`.

## Phases

1. Contract + clock + cockpit shell
2. ~~Poll-diff signal console~~ cancelled
3. Decision dock + honest export/grade

> [!IMPORTANT]
> **User Review Required**
>
> Reply **approve** (or lock it / go / execute) to start.
> Reply with changes to revise. I will not edit the product until you approve.
>
> Optional expanders (say so in the approve note):
> - Official 9-man via existing matchup/lineup API
> - Persist `savedMap` to localStorage
> - Include receipt-export plan in the same execute
> - User-opt-in audio (default remains off)
