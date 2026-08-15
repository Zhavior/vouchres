# HR Max Cards page-scroll virtualization Tasks

- `[x]` **Phase 1 — plan files + scroller helper**
  - `[x]` Write `.agent-plans/2026-08-15-hr-max-cards-page-scroll/`
  - `[x]` `resolveCardBoardScroller.ts` + tests
- `[x]` **Phase 2 — CardBoard + CSS**
  - `[x]` Wire page scroller, overscan 16, measureElement, sticky heads
  - `[x]` overflow-anchor; drop desktop willChange/overscroll-contain
- `[x]` **Phase 3 — verify**
  - `[x]` tsc + focused tests (13 passed)
  - `[x]` Chronos diagnose + scroll-test on http://localhost:3000/hr-max
  - `[x]` Iolaus: PASS WITH ISSUES (Cards visual UNKNOWN)
