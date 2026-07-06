# Master Prompt — Z8 Obsidian Redesign of vouchres

Paste this whole file into a fresh Claude Code session (in this repo, `/Users/boydsantos/Desktop/vouchres`) to resume exactly where this work left off, with full context, if the original conversation is lost or you run out of tokens.

## The goal

Re-skin the entire `vouchres` main app (Vite/React, not the `vouchedge-terminal` Next.js subfolder) with the clean design system that already exists in `vouchedge-terminal` — referred to as **"Z8 Obsidian."** The old vouchres UI is visually inconsistent (a 6,000+ line `index.css` full of `!important` overrides, radial-gradient "space theme" blobs, spinning glow orbit rings, rainbow per-component accent colors). The new one should look like one deliberate product, not a patchwork.

**Explicit instruction from the user**: build fresh, don't just patch the old ugly CSS. Reuse the token system and "ideas" from `vouchedge-terminal`, not its literal JSX/CSS files (those are Next.js-specific and don't apply directly). Every component gets rebuilt from scratch using the tokens below — old `edge-*`/`ve-*` bespoke classes and hardcoded hex colors get replaced, not layered on top of.

## The design system (already installed, do not recreate)

Lives at `src/styles/z8-design-system.css`, imported from `src/index.css` right after `@import "tailwindcss";`. **Do not duplicate this file** — it's already there and working. If it's missing, recreate it exactly as below.

```css
@theme {
  --color-obsidian-900: #050505;
  --color-obsidian-800: #0A0A0A;
  --color-obsidian-700: #121212;
  --color-obsidian-600: #1A1A1A;
  --color-vouch-emerald: #00FF94;
  --color-vouch-cyan: #00F0FF;
  --font-z8: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

@utility glass-panel {
  background-color: rgba(10, 10, 10, 0.4);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.8);
}

@utility glass-border {
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: border-color 0.5s;
  &:hover { border-color: rgba(0, 255, 148, 0.3); }
}

@utility terminal-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: -0.05em;
  text-transform: uppercase;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
}

@utility font-z8 { font-family: var(--font-z8); }
```

**Important gotcha already hit once**: the Inter font `@import url(...)` must live at the very top of `src/index.css` (alongside the other Google Fonts imports), *not* nested inside `z8-design-system.css`. CSS requires all `@import` statements to precede other rules in the final bundled stylesheet — nesting it breaks the dev server with a PostCSS error. If you ever see `[postcss] @import must precede all other statements`, this is why.

## Design rules (non-negotiable, established through direct user feedback)

1. **One accent color per moment, not a rainbow.** Emerald (`vouch-emerald`) = proof/success/primary action. Cyan (`vouch-cyan`) = system/info/tags/secondary. Rose = loss/danger only (kept as Tailwind's `rose-*`, no Z8 token needed — it's semantically correct as-is). Never assign a different hex color per list item "for variety" — that's the "ugly AI SaaS" look the user explicitly rejected.
2. **No gradient blobs, no glow orbit rings, no starfields, no glassmorphism-for-its-own-sake.** These were found live in the old CSS (`radial-gradient(circle at ...)` scattered everywhere, spinning `.edge-space-orbit` rings, twinkling `.edge-starfield` particles) and are the "ugly AI textures" the user asked to eliminate. Flat obsidian background + `glass-panel`/`glass-border` is the whole visual vocabulary — resist adding anything fancier.
3. **`terminal-text` for small eyebrow/label text only** (uppercase, monospace, low-opacity) — never for body copy or headings.
4. **Real data only, always.** This app has a strict pre-existing "no fake data" culture (see any `dataQuality`/"Research & entertainment only" disclaimers already in the code). Never invent stats, fake "AI confidence," or placeholder numbers while reskinning — every number in every file touched so far was already real, sourced from props/API calls. Keep it that way.
5. **Don't touch shared infrastructure carelessly.** `src/components/ui/primitives.tsx` (`Section`, `Card`, `Button`, `StatusBadge`, etc.) is depended on by 7 files. Redesigning it would ripple everywhere at once — bigger risk than doing it page-by-page. When a page uses these primitives, bypass them locally with direct Z8-styled JSX instead of editing the shared file, unless/until you're deliberately doing the primitives file as its own scoped task.
6. **Presentation-only changes.** Never rewrite business logic, API calls, or data shape while reskinning — diff every file afterward to confirm only classNames/JSX structure changed, not content or behavior. (See "Verification" below — this exact question came up and was checked line-by-line successfully.)

## Critical operational gotcha: commit immediately after every change

**This repo has silently reverted uncommitted work at least once during this project** (an entire commit's worth of edits — new files, CSS changes — vanished from disk with zero trace in `git status`, `git stash list`, or reflog, for reasons never fully diagnosed; possibly a sync tool, backup process, or something external to this conversation). The user's explicit instruction after that happened: **redo the work and commit immediately, every time, no exceptions.** Do not batch multiple pages of redesign work before committing. Pattern per page/component:

1. Make the edit(s).
2. `npx tsc --noEmit` (must be clean).
3. `npx vite build` (must be clean).
4. Verify live if practical (see workflow below).
5. `git add <specific files>` (never `-A`/`.`) and commit immediately with a descriptive message.

Also watch for: a stray unrelated `node --import tsx server.ts` process sometimes squats on port 3000 (orphaned from an earlier session, `cwd` pointing at a since-deleted subfolder) — check `lsof -iTCP:3000 -sTCP:LISTEN` and `ps -p <pid> -o command` before assuming it's someone else's active work; kill it if it's clearly our own project's stale process.

## Verification workflow per component

1. `npx tsc --noEmit -p .` — must pass clean.
2. `npx vite build` — must pass clean.
3. Live-check via the preview tools: reload, screenshot, check console for errors.
4. If asked "did you drop a feature," diff precisely: `git diff <last-known-good-commit> HEAD -- <file>` and confirm every hunk is styling-only (class names, colors) with no removed JSX blocks, props, or logic branches.

## Progress so far (commits on branch `premium-shell-upgrade`)

- **`2a1a7e9` — Rebuild landing page on Z8 Obsidian design system**
  Replaced `TheEdgeShell.tsx`'s inline "space theme" hero (radial-gradient blobs, spinning orbit rings, mismatched pale-white CTA button) with a new standalone component `src/components/theEdge/WelcomeIntro.tsx` (+ extracted `GradingDemo.tsx`). Deleted two confirmed-dead orphaned CSS files never imported anywhere (`cyber-theme.css`, `feed-layout.css`). Real data (slate, stats, trust points, workspace modules) untouched.

- **`3e8ca84` — Rebuild The Edge Island on Z8 Obsidian design system**
  Redesigned both Edge Island surfaces: `src/components/theEdge/EdgeIslandCommandCenter.tsx` (the floating popup, opened via a persistent bottom-nav/floating button once logged in) and `src/pages/EdgeIslandPage.tsx` (the full-page dashboard, mounted right after signup/login via the `'island'` section). `EdgeIslandPage.tsx` was deliberately kept off the shared `Section`/`Card` primitives (see rule 5 above). Also fixed the Inter-font `@import` ordering bug described above.

Both commits verified line-by-line diffable to confirm zero content/feature loss — only classNames and structural div→button swaps changed.

## What's left (the rest of the site)

Everything else in `src/` still uses the old `ve-*`/hardcoded-hex/`edge-*` visual language. Known large surfaces not yet touched (from earlier exploration this session — verify each still exists/is current before assuming):

- `src/social/feed/` — the main social feed, `VouchBoard`/`VouchCard`, post composer, feed sidebar, `CmdKPalette`
- Parlay builder / `ParlayCommandCenter` and related parlay dock UI
- MLB Stat Hub (`src/features/mlb-stats/...` or similar — an "8-stat engine" per earlier commit history)
- HR Board / HR watch UI (`HomeRunIntelligencePage`, `HrPlayerCard`, `HrStatsTab` — note: `HrStatsTab`'s batter-vs-pitcher/recent-form data was found to be **seeded mock data**, not real; if touched, do not "match its visual style," and flag the fake-data issue separately since it likely still needs fixing on its own)
- Results/Ledger page, Leaderboard, Profile page, Premium/subscription pages, Theme Store, Settings
- `src/components/ui/primitives.tsx` itself — the shared `Section`/`Card`/`Button`/`StatusBadge`/`RiskBadge` components — this is the highest-leverage single file to redesign since 7+ pages inherit from it, but also the highest-risk (touches everything at once). Recommend doing this **last**, once enough individual pages have been redesigned locally that you know exactly what a redesigned `Section`/`Card` needs to support.

Suggested order: pick one more real, high-visibility page per session (e.g. the social feed next, since it's probably the most-used surface after login), apply the same rules, verify, commit. Repeat. Save `primitives.tsx` for when most consumers have already been individually migrated or reviewed.

## How to resume in a fresh session

Tell the new session: *"Read `Z8_REDESIGN_MASTER_PROMPT.md` in this repo and continue the Z8 Obsidian redesign from where it left off — pick the next real page to rebuild, following the rules and workflow in that file."*
