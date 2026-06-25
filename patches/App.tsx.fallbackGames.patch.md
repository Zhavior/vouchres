# App.tsx fallbackGames patch

## Problem

`src/App.tsx` lines 64-138 contain a hardcoded `fallbackGames` array —
12 fake MLB games with fabricated statuses like "In Progress (7th Inning)",
fake scores, fake pitchers. When the real `/api/mlb/live` call fails,
the UI silently swaps in these fake games, misleading the user into
thinking live data is flowing.

## Fix

Remove the fallback entirely. When `/api/mlb/live` fails, show an honest
"Live games temporarily unavailable" state. The MLB data is the product —
fabricating it is the worst kind of degradation.

### Apply this diff

```diff
@@ // src/App.tsx
- const fallbackGames = [
-   {
-     id: 'fallback-1',
-     status: 'In Progress (7th Inning)',
-     away: { team: 'NYY', score: 2 },
-     home: { team: 'BOS', score: 3 },
-     ...
-   },
-   ...11 more...
- ];

@@ // inside the fetch effect (around line 140)
- const games = data?.games ?? fallbackGames;
+ const games = data?.games ?? [];

@@ // in the render, where liveGames is mapped
- {games.map(game => <LiveGameCard key={game.id} game={game} />)}
+ {games.length > 0 ? (
+   games.map(game => <LiveGameCard key={game.id} game={game} />)
+ ) : (
+   <div className="live-games__empty">
+     <p><strong>Live games temporarily unavailable.</strong></p>
+     <p>We couldn't reach the MLB Stats API. This is usually temporary —
+        try refreshing in a minute.</p>
+     <button onClick={refetch}>Retry</button>
+   </div>
+ )}
```

### Also check

- `src/utils/mlbApi.ts:73` logs `Loaded ${cachedActivePlayers.length}...` to
  console — fine for dev, but wrap in `if (import.meta.env.DEV)` for prod.
- The browser-side `src/lib/mlbDirect.ts` fallback also calls the MLB API
  directly from the client. This is fine for resilience, but be aware it
  means rate limits apply per-browser, not per-server. Consider routing
  all MLB calls through your backend in production.
