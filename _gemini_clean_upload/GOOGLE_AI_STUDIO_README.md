# READ FIRST — VouchEdge Debug Only

This is NOT a request to design a new website.

VouchEdge is a sports research/proof SaaS app:
- MLB research
- parlay building
- HR board
- capper profiles
- proof ledger
- subscriber/capper system
- The Edge public portal
- The Island logged-in dashboard

## Current bug

Pages load, then disappear/reset.
Buttons sometimes enter the site then bounce back.
Vite was watching backup files and full-reloading.
Auth gate may be redirecting safe public pages.

## Your task

Audit the uploaded codebase and give exact minimal patches for:
1. `src/App.tsx`
2. `src/components/theEdge/TheEdgeShell.tsx`
3. `src/components/theEdge/TheEdgeOverlay.tsx`
4. `src/social/feed/HomeFeedLayout.tsx`
5. `vite.config.ts`

## Do not do this

- Do not redesign the site.
- Do not make a 4K video website.
- Do not invent a different business.
- Do not create new pages.
- Do not remove features.
- Do not rewrite the whole app.

## Desired behavior

Logged out:
- Welcome/The Edge is public.
- Safe preview pages can load.
- Profile, results, parlays, billing, admin require login.

Logged in:
- The Island dashboard loads.
- Dashboard stats come from `/api/me/dashboard-summary`.
- Results stats come from `/api/me/ledger`.

## Output required

Return:
1. Root cause
2. Exact file edits
3. Minimal code patches
4. Build-risk notes
