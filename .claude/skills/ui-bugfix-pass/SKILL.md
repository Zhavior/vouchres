---
name: ui-bugfix-pass
description: Fix the known auth/modal/UI bugs tracked in docs/UI_FIX_PLAN.md for the vouchres app. Use when asked to work through that punch list, fix a specific bug from it, or re-run the UI review. Saves re-discovering login flow and repro steps from scratch.
---

# UI bugfix pass — vouchres

The punch list lives in [docs/UI_FIX_PLAN.md](../../../docs/UI_FIX_PLAN.md).
Read it first, pick the next unchecked item (P0 before P1 before P2), fix it,
verify in the browser preview, check the box, commit.

## Fast path to an authenticated session (don't rediscover this)

1. `preview_start` with name `vouchres-dev` (or reuse the server already on
   port 3000 if one's running — check `lsof -nP -iTCP:3000 -sTCP:LISTEN`
   before starting a new one).
2. Signup requires no email verification (`AuthModal.tsx` — confirmed
   disabled on the Supabase project) but the `.local` TLD is rejected by
   client validation — use `@example.com`. **Note**: as of the 2026-07-22
   review, valid `@example.com` addresses were *also* triggering a stuck
   "Please enter a valid email address" error — that's P0 bug #1 on the
   list. If it's still broken, that's the first thing to fix, since it
   blocks testing everything downstream of signup.
3. Faster alternative while that bug is open: most research sections are
   public and don't require login — `PUBLIC_SECTIONS` in
   `src/app/sectionNavigation.ts` includes `live_games`, `hr_board`,
   `daily_players`, `top_cappers`, `mlb_stats`, `game_research`,
   `player_research`, `build`. Direct URLs that work:
   `/hr-board`, `/daily-players`, `/mlb-stats`, `/build`. `today` and World
   Chat are NOT public — need a real session for those.
4. If a stale authenticated session already exists in the browser preview's
   localStorage (leftover from a prior session), a full navigate to any
   `/hr-board`-style URL will land you inside the app already logged in.
   Don't assume you're logged out just because the landing page flashed —
   check for the "LOG OUT" button / avatar in the top-left before starting
   a fresh signup.

## Known click-target gotcha

Raw pixel-coordinate clicks (`computer` tool with `coordinate`) have
misfired in this app — a click meant for a sidebar nav item landed on
different content and logged the session out. **Always click via `ref`**
from a fresh `read_page` call, not remembered coordinates from an earlier
screenshot. Sidebar icon buttons are also unlabeled in the a11y tree in
places (that's bug P1 #2) — if `read_page` gives you `button [ref_N]` with
no name, cross-check against a screenshot before clicking.

## Verifying each fix

- P0 #1 (signup email stuck): fill email with `@example.com`, submit twice,
  confirm the error clears and account creation succeeds.
- P0 #2 (session drop on Pro Labs nav): log in on Basic plan, click a Pro
  Labs sidebar item (e.g. "Pitchers Matchup"), confirm you see an upgrade
  prompt, not the logged-out landing page.
- P0 #3 (guest button dead): click "Continue as guest" on the auth modal,
  confirm it either starts a guest session or is removed.
- P0 #4 (⌘K focus): open command palette, type immediately without
  clicking, confirm the list filters.
- P1 #1 (modal scrim): open the onboarding tour and World Chat, confirm
  background text doesn't bleed through / collide with modal content.
- P1 #2 (unlabeled nav icons): `read_page filter:interactive` on the
  collapsed sidebar, confirm every button has a name.

After fixing and verifying, update the checkbox in
`docs/UI_FIX_PLAN.md` and move to the next item — don't batch all fixes into
one giant diff, keep them separable so each is easy to review.
