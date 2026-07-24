# Visual System Plan — Z8 Obsidian consolidation

Source: visual systems audit, 2026-07-22. Target: one coherent Z8 identity across
app chrome, auth, and landing. Check items off as fixed.

## P0 — system integrity

- [x] **Landing terminal chat demo removed.** `TerminalChatDemo` on
  `VouchEdgeTerminalPage` deleted; all other landing sections preserved.
- [x] **Auth accent drift fixed.** AuthModal hardcoded `#00F0FF` replaced with
  Z8 token exports (`Z8_CYAN_HEX`, `Z8_AUTH_GRADIENT`, `Z8_AUTH_SHADOW`).
- [x] **Sidebar glow budget reduced.** Active nav drops stacked neon shadows;
  icon box uses fill only; live-data ping animation removed.

## P1 — navigation architecture

- [x] **Collapsible sidebar groups.** Daily open by default; Pro Labs, AI,
  Build & Track, Social, Account collapsed. Persists in localStorage; auto-expands
  when navigating to an item inside a collapsed group.
- [x] **Duplicate discovery CTA removed.** Dashed “Explore all tools” footer
  button removed; compact Cmd+K / “All tools” row kept.

## P2 — typography & color polish

- [x] **Sidebar label floor.** Group headers raised to 11px minimum.
- [x] **Feed card legacy CSS migration.** Z8 palette in `legacy/feed.css` vars;
  `.feed-post.z8-feed-card` opt-in on `FeedPostCard`; post-type badges use Z8 hex.
- [x] **Profile proof surfaces.** Share card uses Z8 panels/stats; emoji and
  `#FFE81F` yellow stamp removed.
- [ ] **Mobile chrome unification.** Resolve bottom nav vs World Chat FAB vs
  ParlayOS dock stacking (separate pass).

## How to verify

1. Landing: confirm chat box gone; hero, device showcase, live games, pricing,
   FAQ still present.
2. Auth modal: CTAs and progress dots use Z8 cyan (`#4FB8DC`), not hot `#00F0FF`.
3. Sidebar: Pro Labs collapsed on fresh load; expands when clicking a Pro item.
4. `npm run typecheck` and `npm run build`.
