# Parlay System — Manual E2E Checklist (for Boyd)

Run these in a real logged-in browser. Open DevTools → Console; the app logs
`[parlays] …` debug lines in dev mode (`import.meta.env.DEV`) at each step.

## A. Save → instant card
1. Log in.
2. Go to **Parlay Dock** (Build) and create a manual parlay with ≥1 leg.
3. Click **Save**.
   - ✅ A card appears immediately on **My Parlays**.
   - ✅ Sync chip shows **Saving…** then flips to **Synced** within ~1–2s.
   - Console: `POST /api/me/parlays { clientRef: 'parlay-…' }` then `synced { id, deduped:false }`.

## B. Refresh persistence
4. Hard-refresh the page (Cmd-Shift-R).
   - ✅ The parlay still appears.
   - ✅ Chip shows **Synced** + "Last synced …".
   - Console: `[parlays] loaded from backend N`.

## C. Logout / login persistence
5. Log out, then log back in.
   - ✅ The parlay still appears (loaded from `GET /api/me/parlays`).
   - ✅ Legs render with selection + odds; footer shows odds / stake / potential / game date.

## D. Retry sync (failure path)
6. Simulate a failure: in DevTools, go offline (Network → Offline) OR stop the
   API server, then save a new parlay.
   - ✅ Card stays, chip shows **Sync failed** (or **Local only** if not signed in),
     amber warning row appears, and a **Retry Sync** button shows.
7. Go back online / restart the server, click **Retry Sync**.
   - ✅ Chip flips Saving… → **Synced**; `backendPickId` is attached (chip stops
     offering Retry). Console: `synced { id, deduped:false }`.

## E. Duplicate protection
8. Save a parlay, then immediately click Save again (double-click), or click
   **Retry Sync** twice fast on the same card.
   - ✅ Only ONE backend row is created. Second attempt is skipped client-side
     (`skip save — already synced`) and, if it reaches the server, returns the
     existing row (`deduped:true`). Verify in Supabase: one `picks` row per parlay.
   - NOTE: server-side dedup requires migration `0003` (client_ref). Without it,
     client-side guard still prevents most dupes.

## F. Grading safety (no invented results)
9. Save a parlay whose game has NOT finished. Click **Refresh Results**.
   - ✅ Status stays **Pending** (never flips to won/lost without final data).
10. After a real game finishes, Refresh Results again.
    - ✅ Any lost leg → parlay **Lost**; all legs won → **Won**; mixed won+void → **Partial (void)**.

## Smoke tests (no auth) — run with the API up
```
curl -s -o /dev/null -w "%{http_code}\n"      http://localhost:3000/api/me/parlays          # 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/me/parlays \
  -H 'Content-Type: application/json' -d '{"legs":[]}'                                       # 401 (auth before validation)
```
With a valid bearer token + `{"legs":[]}` → **400 legs_required**.

## DB migrations to apply (review first — NOT auto-run)
- `supabase/migrations/0002_parlay_rls_hardening.sql` — DELETE policy.
- `supabase/migrations/0003_parlay_idempotency_atomic.sql` — client_ref/source + atomic RPC.
- `supabase/migrations/0004_grading_logs.sql` — grading audit log.
- `supabase/migrations/0005_parlay_visibility.sql` — **proposal**, private-by-default reads.
