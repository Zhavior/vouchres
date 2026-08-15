# HR Intelligence Command Desk (`hr-v2`)

Enterprise intelligence desk for Aurora HQ calibrated MLB home run predictions, market implied probability, and live game telemetry.

---

## 1. Architecture Overview

- **Entry Point**: `HrIntelligencePageV10.tsx` (wrapped in `HrErrorBoundary`).
- **Data Layer**: `useHrSlateFeed.ts` polls every 45s with automatic 2-tier retry telemetry (`isRetrying`, `failureCount`, `isFailed`).
- **Views**: `ChunkABoard` (Card / Table) and `KanbanView` are static imports on the page — no inner `lazyWithRetry` / `React.lazy` competing with first paint.
- **Pure Helpers**: `calculateEV`, `filterSlateItem`, `sortSlateItems`, and `safeNumber` (`src/utils/safeNumber.ts`) provide defensive, deterministic data shaping.
- **Render Performance**: Board containers use `content-visibility: auto` with a dynamic `containIntrinsicSize` estimate so 200–400+ DOM nodes don't cause paint jank on initial load or scroll.

### Two-Step Data Fetch

`fetchLiveMlbSlate()` in `api/mlbLiveService.ts` operates in two steps, each producing a discrete latency budget:

**Step 1 — Schedule + Lineups (single request):**
```
GET /api/v1/schedule?sportId=1&date={today}&hydrate=probablePitcher,linescore,lineups
```
This returns every game for the day. The `lineups` hydration is **inline** (no second HTTP round-trip). The `game.lineups.homePlayers` / `game.lineups.awayPlayers` arrays contain confirmed batting lineup entries ordered by slot (index 0 = leadoff). Games without posted lineups have `lineups: undefined` or empty arrays.

> **Verified 2026-08-13:** 9 games, all with full 9-player lineups. Typical volume: ~13–15 hitters/team, ~230–400+ total hitters depending on game count.

**Step 2 — Parallel Active Roster Fetches:**
```
GET /api/v1/teams/{teamId}/roster?rosterType=active
```
All unique team IDs across the slate are deduplicated into a `Set<number>` first (doubleheader-safe). Rosters are fetched in parallel via `Promise.all`. Per-team failures are caught individually — one team's 500 or timeout does not block other teams' data. The failing team is logged:
```
console.warn('[mlbLiveService] Roster fetch failed for teamId={id}: HTTP 500')
```
If more than 20% of teams fail their roster fetch on a given poll, a degradation warning is emitted:
```
console.warn('[mlbLiveService] Degraded: X/Y teams failed roster fetch — Z% failure rate')
```

Timeout for the entire window: `ROSTER_FETCH_TIMEOUT_MS` (6000ms) — set in `constants.ts`.

---

## 2. Data Model: lineupStatus and scoreBasis

Every `ChunkA` player record carries two new discriminating fields:

### `lineupStatus: 'confirmed_starter' | 'roster' | 'unknown'`

| Value | Meaning | Set when |
|-------|---------|----------|
| `'confirmed_starter'` | Player's ID found in `game.lineups.homePlayers` / `awayPlayers` | Lineup posted in schedule response |
| `'roster'` | On active roster, but NOT in the posted lineup | Lineup was posted but player not in it |
| `'unknown'` | Lineup data unavailable or not yet posted for this game | `game.lineups` is absent or empty |

`lineupSlot?: number` is also set (1–9) for confirmed starters based on their array index.

### `scoreBasis: 'confirmed_lineup' | 'roster_baseline'`

| Value | Score range | Meaning |
|-------|-------------|---------|
| `'confirmed_lineup'` | `CONFIRMED_STARTER_MIN`–`CONFIRMED_STARTER_MAX` (60–94) | Slot-aware bonus: slot 1 → highest, slot 9 → lowest |
| `'roster_baseline'` | `SCORE_BASELINE_MIN`–`SCORE_BASELINE_MAX` (52–59) | Placeholder. Always strictly below the lowest confirmed score in the batch |

**Invariant:** No `roster_baseline` score may meet or exceed the lowest `confirmed_lineup` score in the same slate. This is enforced post-hoc after scoring all records.

---

## 3. Persisted State & Validator Pattern

All user-selected controls synchronize to `localStorage` via `usePersistedState(key, default, validator)`. Every key requires a pure validator to guard against schema changes or corrupt storage:

```ts
export function validateX(val: unknown): TargetType {
  return isValid(val) ? val : DEFAULT_FALLBACK;
}
```

### Storage Key Convention: `ve_hr_v10_*`
To prevent collisions across features and routes, all keys use the `ve_hr_v10_` prefix:
- `ve_hr_v10_viewMode`: `'card' | 'table' | 'kanban'` (default: `'card'`)
- `ve_hr_v10_selectedTier`: `'all' | 'very_high' | 'high' | 'moderate'` (default: `'all'`)
- `ve_hr_v10_minScore`: `50..90` clamped integer (default: `60`)
- `ve_hr_v10_sortBy`: `'score' | 'ev' | 'odds'` (default: `'score'`)
- `ve_hr_v10_startersOnly`: `boolean` (default: **`true`**) — Starters Only filter

### Starters Only Filter

**Default: ON.** First-time users (no persisted preference) see only confirmed lineup starters rather than the full 230–400+ active roster. This prevents the board from being overwhelming when lineups haven't posted yet.

Users can toggle to **Full Roster** via the pill toggle above the board. The count indicator ("Showing 42 of 235 active roster hitters") always reflects the current filter state so users understand data isn't missing.

---

## 4. Telemetry & Retry State Machine

1. **Initial Fetch (`loading && data.length === 0`)**: Displays `<BoardSkeleton />`.
2. **Transient Reconnection (`isRetrying && data.length === 0`)**: Displays amber `RECONNECTING (N/2)` indicator and attempt status while maintaining background polls.
3. **Fatal Failure (`error && data.length === 0`)**: Displays error banner with retry trigger.
4. **Active Feed (`data.length > 0`)**: Displays live board, relative timestamp (`formatTimeAgo`), and screen reader status updates via `aria-live="polite"`.

---

## 5. Common Tasks

### (a) Adding a New Sort Option
1. Add union member to `SortOption` in `HrIntelligencePageV10.tsx`.
2. Add validation branch in `validateSortBy(val)`.
3. Add comparator branch in `sortSlateItems(a, b, sortBy)`.
4. Add label to `STRINGS_EN.controls.sortOptions` in `stringsEn.ts` and `<option>` in `<select id="slate-sort-select">`.

### (b) Adding a New View Mode
1. Add union member to `ViewMode` in `HrIntelligencePageV10.tsx`.
2. Add metadata to `STRINGS_EN.views` in `stringsEn.ts` and `VIEW_OPTIONS` array.
3. Add validation branch in `validateViewMode(val)`.
4. Render the view statically in the page (no inner `lazyWithRetry` / `Suspense` split).

### (c) Adding a Persisted Filter Control
1. Declare `usePersistedState('ve_hr_v10_<name>', defaultVal, validate<Name>)` in `HrIntelligencePageV10.tsx`.
2. Create pure `export function validate<Name>(val: unknown): T` fallback sanitizer.
3. Add filtering predicate inside `filterSlateItem(item, options)`.

### (d) Adding a Localized String
1. Define string or formatting template function in `stringsEn.ts` (`STRINGS_EN`).
2. Reference via `STRINGS_EN.<section>.<key>` in JSX/helpers.

---

## 6. Testing & Verification

Run the complete HR feature test suite:
```bash
npm test -- tests/mlbLiveService.test.ts tests/safeNumber.test.ts tests/hrIntelligencePageV10.render.test.tsx tests/hrIntelligencePageV10.test.tsx tests/hrIntelligenceLogic.test.ts tests/hrIntelligenceCapture.test.ts
```

Always verify TypeScript compilation before committing:
```bash
npm run typecheck
```

---

## 7. Known Gaps & Architectural Trade-offs

1. **Error Telemetry**: `HrErrorBoundary` and feed state machines are wired to production Sentry (`captureReactError` and `trackEvent`). In local offline development environments without Sentry DSN configuration, telemetry calls degrade gracefully into `console.error` without impacting user experience.
2. **Timezone Representation**: Timestamp pills display relative elapsed time (`formatTimeAgo`) via millisecond arithmetic (inherently timezone-agnostic). Tooltips format absolute time via `toLocaleTimeString()` using the user's browser locale and timezone by design (live status desk rather than schedule coordinator).
3. **Progressive Enhancement**: All animations respect `prefers-reduced-motion: reduce` via `motion-reduce:animate-none`. Critical states (reconnecting, live, updated, filtering) provide dual visual cues (explicit text + distinct static colors) rather than relying on motion alone.
4. **Handedness**: Batter handedness is not exposed by the roster or lineup endpoints without a separate `/people/{id}` hydration per player. Currently hardcoded `'R'` as a placeholder. A future enrichment pass can hydrate `batSide` at the ChunkB layer without changing the ChunkA contract.
5. **Lineup-less games**: When `game.lineups` is absent (early in the day before lineups post), all players are tagged `lineupStatus: 'unknown'`. The Starters Only filter will show 0 results in this state; users should switch to Full Roster view until lineups are posted. A future enhancement could show a "Lineups not yet posted" banner in this case.
6. **Content-visibility browser support**: `content-visibility: auto` is supported in Chrome 85+, Edge 85+, and Safari 15.4+. Firefox has full support as of FF 113. The `containIntrinsicSize` fallback is a no-op in older browsers — layout remains correct, just without the paint-skip optimization.
