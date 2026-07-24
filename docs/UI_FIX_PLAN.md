# UI Fix Plan — auth/modal reliability pass

Source: UI Judge review of the running app, 2026-07-22. Score 64/100 — visual
design is solid, the interaction layer (modals, auth, command palette) has
real bugs. This doc is the punch list. Check items off as fixed.

## P0 — functional blockers

- [x] **Signup email validation stuck.** Entering a valid email
  (`name@example.com`) into the signup form keeps showing "Please enter a
  valid email address" even after correcting it and resubmitting. Error
  state isn't clearing on valid input. Find the signup form component
  (`AuthModal.tsx` per grep) and check whether the error is keyed off stale
  state or a regex that's actually wrong.
- [x] **Session drops on Pro Labs navigation.** Clicking a gated Pro Labs
  sidebar item (e.g. Pitchers Matchup) while on Basic tier doesn't show an
  upgrade prompt — it silently deauths back to the logged-out landing page.
  Should show an upsell/paywall, not kill the session. Repro: log in on
  Basic plan, click Pitchers Matchup in the Pro Labs sidebar section.
- [x] **"Continue as guest" removed.** Guest browse entry points were removed
  from the auth modal and legacy landing nav — sign-in is required to enter
  the app beyond public research URLs.
- [x] **Command palette (⌘K) ignores keystrokes on open.** Typing
  immediately after opening loses focus — you have to click the search
  input first. Likely a focus-timing bug (autofocus not firing before the
  open animation/mount settles).

## P1 — visual defects

- [x] **Modals/panels have no backdrop scrim.** The onboarding tour ("AI
  Judge Council") and the World Chat panel both render with no dimming
  behind them, so background page content stays fully legible and visually
  collides with the modal's own text. Add a consistent
  `bg-black/60 backdrop-blur` (or whatever the design system's existing
  scrim token is) behind every overlay — check if one already exists and is
  just not applied to these two.
- [x] **Sidebar icon-only nav buttons have no accessible label** in the
  collapsed Pro Labs rail — several buttons expose no text to the a11y tree.
  Add `aria-label` at minimum; a hover tooltip would also fix the sighted-user
  version of the same problem.

## P2 — polish

- [x] World Chat message bubbles are cramped against the panel edge, no
  breathing room between consecutive same-sender messages.
- [x] "0% WIN RATE" reads as a failing grade for new/guest accounts with no
  graded picks yet. Swap to an empty state ("No graded picks yet") when
  pick count is 0.

## How to verify a fix

Use the `ui-bugfix-pass` skill (`.claude/skills/ui-bugfix-pass/SKILL.md`) —
it has the exact repro steps and a known-working way to get an authenticated
session in the browser preview without repeating the discovery work above.
