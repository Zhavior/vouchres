# Adding a Sport (NBA / NFL / …)

VouchEdge is built so a new sport is **additive** — you implement a small set of
per-sport pieces and register them. You never touch the MLB engine, the parlay
lifecycle, the grading combine math, the notification system, or the UI shells.

The architecture has one rule: **everything sport-specific hides behind a
`SportId` key.** The single source of truth is:

```
src/sports/registry.ts  →  export type SportId = 'mlb' | 'nba' | 'nfl';
```

Add your sport id there first; TypeScript then guides you to every place that
needs an entry (the `Record<SportId, …>` maps won't compile until you fill them).

---

## The 7 touchpoints (in order)

### 1. Register the sport — `src/sports/registry.ts`
Add a `SportConfig` to `SPORTS`: `label`, `emoji`, `enabled`, `boardEndpoint`,
`lineupEndpoint`, `primaryMetric`. Flip `enabled: true` only once the data
endpoints (step 5) exist. The sidebar sport switcher and all endpoint lookups
read from here automatically.

### 2. Market taxonomy — `src/sports/markets.ts`
Add a `resolve<Sport>Market(label, spec)` and a `case` in `resolveMarket`. Map
the sport's prop labels → normalized `marketCode` + `threshold`
(MLB: `hr`/`rbi`/`run`/`hits`/`tb`; NBA: `pts`/`reb`/`ast`/`threes`; etc.).

### 3. Server grader — `server/services/grading/sportGraders.ts`
Replace the `comingSoonGrader('nba')` stub with a real `SportGrader`:
- `fetchGame(gamePk)` → `{ final, raw }` from the sport's box-score API
- `evaluateLeg(leg, game)` → `won | lost | push` by reading the stat for the
  leg's `marketCode`
Register it in `sportGraders`. Both grading paths (the stateless
`POST /api/parlays/grade` **and** the production cron grader) light up at once —
the parlay-combine math (`settleParlay`) is already shared and sport-agnostic.

### 4. Edge engine (optional) — `server/services/<sport>/`
MLB has the HR engine. A new sport gets its own edge engine here (e.g. a points
projection). Keep it isolated under its own folder — never generalize the MLB
engine. It only needs to output rows with `playerId`, `playerName`, `gamePk`,
odds, and a score.

### 5. Data endpoints — `server/routes/<sport>Routes.ts`
Implement the two endpoints named in the registry:
- `lineupEndpoint`  → confirmed lineups + **game start times** (drives the
  30-min lock) + confirmed starters (drives AI generation)
- `boardEndpoint`   → the daily edge/props board
Match the MLB response shapes (`games[].gameDate`, `games[].lineupConfirmed`,
`games[].awayLineup/homeLineup[].battingOrder`) and everything downstream works
unchanged. Register the routes in `server/routes/index.ts`.

### 6. AI generation — already automatic
`src/lib/aiParlayGenerator.ts` keys off `SPORT_LINEUP_ENDPOINT[sport]`. Once your
`lineupEndpoint` returns confirmed starters in the standard shape, scheduled AI
parlays generate for the sport with **zero new code** — legs carry `gamePk`,
`gameStartTime`, and `marketCode`, so the lifecycle + grading just work.

### 7. Lifecycle / Results / Live Parlays — already automatic
`src/lib/parlayLifecycle.ts` is fully sport-agnostic (upcoming → live → final
from game start times). The Live Parlays page, Results grading, and the
notification dispatch (`src/lib/appNotifications.ts`) require **no changes**.

---

## Parlay-specific touchpoints (NFL / NBA)

Smart Parlay slips are **sport-agnostic** at the read-model layer
(`src/domain/parlay/smartParlayTypes.ts`). To light up NFL parlays after MLB:

| Step | File | What to add |
|------|------|-------------|
| Capabilities | `src/sports/parlaySportCapabilities.ts` | Flip `liveProgress`, `marketCatalog`, `productionGrading`, `aiGenerate` for `nfl` |
| Market picker | `src/lib/parlays/parlayMarketCatalog.ts` | Populate `NFL_PARLAY_MARKET_FAMILIES` |
| Market resolver | `src/sports/markets.ts` | Extend `resolveNflMarket()` |
| Live progress | `server/services/nfl/nflLiveProgressService.ts` | Wire to NFL boxscore provider |
| Gateway | `server/services/data/dataProviderRegistry.ts` | Replace `nfl_stats` planned entry with real provider |
| Grader | `server/services/grading/sportGraders.ts` | Replace `comingSoonGrader('nfl')` with real `nflGrader` |
| Routes | `server/routes/nflRoutes.ts` | Replace 503 stubs with real lineup + edge-board |
| Registry | `src/sports/registry.ts` | `SPORTS.nfl.enabled = true` |

**Already sport-dispatched (no rewrite needed):**
- Save path (`parlayCreationService`, `pick_legs.sport`)
- Grade preview (`POST /api/parlays/grade` → `getGrader(leg.sport)`)
- Live progress router (`POST /api/parlays/live-progress` → dispatches by `leg.sport`)
- Smart Parlay UI cards (`SmartParlaySlipCard`, `SmartParlayLegCard`)
- Parlay combine math (`settleParlay`)

---

## What you NEVER touch
- `server/services/mlb/**` (HR Engine Pro v2) — MLB-only by design.
- `settleParlay` parlay-combine math — sport-agnostic.
- `parlayLifecycle.ts`, `appNotifications.ts`, the Live Parlays / Results UIs.
- The grading client (`src/lib/parlayGrading.ts`) — talks to the registry.

## Definition of done for a new sport
- [ ] `SportId` includes it; `SPORTS[id].enabled = true`
- [ ] `resolveMarket` handles its prop labels
- [ ] A real `SportGrader` registered in `sportGraders`
- [ ] `lineupEndpoint` + `boardEndpoint` implemented and registered
- [ ] `npx tsc --noEmit` is clean (the `Record<SportId, …>` maps force completeness)

If those five boxes are checked, the sport switcher, AI parlays, the 30-minute
lock, Live Parlays, grading from the official box score, Results, and
notifications all work — because they were built against the contract, not MLB.
