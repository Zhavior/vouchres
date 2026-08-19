# Landing One-Record Implementation Plan

Status: DONE
Slug: 2026-08-18-landing-one-record
Repo: /Users/boydsantos/Desktop/Projects/Vouch/vouchres
Mode: FULL
CONTEXT_STAMP: 2026-08-18 (session date). Memory MCP: EMPTY. Landing lessons: EMPTY (L020 is BvP routing, not this page). Stamp is when-checks-ran, not fresh web data.

## Goal

The public VouchEdge landing (`VouchEdgeLandingV3` on `/vouchedge-preview` and logged-out `/`) becomes **one persistent live research record** in a quiet dark editorial page — Meuze’s architecture (one object, four verbs, then proof), not Meuze’s brand. A visitor can name the product, the promise, and inspect today’s slate without sitting through three stacked scroll movies.

## Locked forks (the 8 that made the last brief an 8)

| # | Fork | Lock |
|---|---|---|
| 1 | Which pin dies | **Delete `CinematicEditorialStory`.** Keep one How-it-works pin (collapsed TruthFlow: 4 tabs, one record). Flatten `ResearchTelemetryStory` — no second pin theater. |
| 2 | Hero artifact | **The live research record** from `useResearchPreview`. No ballpark stock photo this pass (no licensed still on disk → wallpaper FAIL). No hardcoded NYY @ BAL terminal. Empty/error feed → labeled unavailable, not a demo matchup. |
| 3 | Brand | Nav/wordmark: **VouchEdge**. Record object: **VouchRes** once in the hero body (“a VouchRes record”). Kill `VOUCHRES //` chrome spam. |
| 4 | Type | Existing kit only. **Space Grotesk** = H1/H2 (`--font-display`). **Cabinet Grotesk** = body/nav (`--font-sans`). **JetBrains Mono** = scores/timestamps inside the record. No Clash, no Lora, no system-ui on the H1. |
| 5 | Mobile | `<768px` and `prefers-reduced-motion`: **no sticky pin**. Stack: brand → headline → one CTA → record. Tabs are a vertical list. Screenshot 390 and ~1116. |
| 6 | Done | Apple Craft Judge on live `/vouchedge-preview` with desktop + mobile receipts. Reduced-motion path exercised. `60fps: UNKNOWN` — do not claim smooth. Conversion test retargeted to the mounted page. |
| 7 | Cookie | **Do not rewrite `CookieConsentBanner`.** It is already a corner card (`fixed bottom-3 right-3 max-w-lg`). The “takeover” was an empty boot shell. Landing must paint a hero so the chip sits on content. |
| 8 | WIP | Continue from the current uncommitted landing. Do not restore `.landing-backups/`. Do not commit `vouchres-ultimate-truth-landing.css.before-editorial-repair`. Auth modal CSS is a separate WIP — out of scope. |

## Craft brief

**Product / surface:** web marketing — logged-out landing + `/vouchedge-preview`
**Thesis:** One live research record stays on screen; the page mutates it from matchup to grade.
**Primary artifact:** today’s `useResearchPreview` row (player, matchup, evidence states). Not a terminal skin of a fake game.
**Brand in first viewport:** VouchEdge mark + wordmark left; headline does not bury the name.
**Motion beats:**
1. Hero holds; record is already the object (no delayed reveal of a second UI).
2. How-it-works tabs/scroll rewrite fields in place (Matchup → Signals → Vouch → Outcome).
3. Live proof section is the same object, unpinned, inspectable.
**Reduce-motion path:** unpin; cross-fade or instant swap; no scroll-hijack. Same for `<768px`.
**Color / material:** keep `#050507` field, hairline `#292929`, one cyan accent already on the mark. No Meuze blue, no cream editorial light-theme, no neon glow soup.
**Typography:** Space Grotesk display, Cabinet Grotesk body, JetBrains Mono in the record.
**Non-goals:** Meuze clone; stock photography; second cinematic pin; invented 2,000+ / 68-confidence / fake sparkline heights; restoring Pricing/Community/AuroraHero; WebGL hero; `chronos repair --apply`.
**Designer(s):** apex-creative-engineer (Standard marketing, not Cognitive-Safe desk)
**Acceptance:** apple-craft-director rubric PASS (all ≥ 4) with screenshot + live URL

## Market psych (locked)

Desire: stand behind a pick after the game.
Fear: tout energy; a briefing that never ends.
Promise: *Don’t just find an edge. Leave a record that still exists after the game.*
Proof allowed: today’s live slate + explicit missing states. Meuze’s “2,000+ locations” and “2,220 guests” are unverified theater — do not mirror.
CTA job: **Get access** (primary). **Inspect this record** scrolls to `#record` (same viewport secondary).
Copy once: “Confidence describes the strength of the available evidence, not a promise of an outcome.”

## Page architecture (after)

```
nav          VouchEdge · How it works · Live record · Log in · Get access
#top         hero — one viewport — live record + promise + CTAs
#how-it-works  ONE pin (desktop, motion-ok) — 4 tabs, same record
#record      flattened live inspect (ResearchTelemetryStory, no pin)
#access      4 steps + existing footer
```

Four mechanism verbs: **Matchup / Signals / Vouch / Outcome.**
Four close steps: Get access → Inspect today’s record → Track a Vouch → See it graded.

Integrity chain is a caption under How it works, not a chapter. `vu-integrityNote` and `CinematicEditorialStory` go away.

## Honesty kills (must not ship)

- Hardcoded `NYY @ BAL` / Yankees–Orioles as if live.
- Confidence orb literal `68` in `ResearchTelemetryStory`.
- Fake sparkline heights `[32, 69, 45, 88, 52, 74, 38, 91]`.
- Invented user counts, win rates, or “Refreshed 2 sec ago.”
- Conversion test still asserting dead `AuroraHero` / `ResearchPreviewSection` on this mount.

## In scope

- Restructure `VouchEdgeLandingV3`: hero + one mechanism pin + flattened live proof + 4-step close + footer.
- Patch landing CSS: type tokens, unpin breakpoints, kill cinematic chapter styles in use, quieter chrome.
- Flatten `ResearchTelemetryStory` to a single inspect (act 1 matrix as default). FAQ may stay at `#access` or at the end of `#record` — one FAQ block, not two.
- Align footer IDs in `VouchEdgeTerminalPage` (`how-it-works`, `research-preview` → `#record`, Beta → `#access`).
- Retarget `tests/publicLandingConversion.test.ts` at the mounted V3 page.
- Visual receipts: `/vouchedge-preview` desktop + 390px, plus reduced-motion note.

## Out of scope

- `CookieConsentBanner.tsx` rewrite
- `AuthModal.tsx` / `auth-modal.css`
- Restoring `PricingSection` / `CommunitySection` / `AuroraHero` / archived landings
- Ballpark photography / scroll-scrub video
- Light-theme Meuze clone
- App desk (`Aurora Max`) at `/`
- Chronos `repair --apply`
- Invented stats

## Files

- `src/pages/VouchEdgeLandingV3.tsx` — page tree; delete cinematic; hero uses live preview
- `src/styles/vouchres-ultimate-truth-landing.css` — targeted patches (type, pin, cinematic unused, mobile)
- `src/components/landing/ResearchTelemetryStory.tsx` — unpin; kill fake 68 + fake bars
- `src/components/landing-v3/FooterSection.tsx` — close steps + link labels if needed
- `src/pages/VouchEdgeTerminalPage.tsx` — footer scroll IDs
- `src/components/landing-v3/researchPreviewData.ts` — only if hero needs an extra field already in the feed (no invented fields)
- `tests/publicLandingConversion.test.ts` — contract for the mounted landing

## Risks

- `publicLandingConversion.test.ts` currently asserts `AuroraHero` strings the live page does not mount — update the test, do not remount the dead hero to make it pass.
- Pin + live data: if the HR board feed is empty, hero must say so (UNKNOWN), not fall back to Yankees.
- CSS file is large — patch by selector, do not rewrite the whole file.
- Uncommitted auth-modal WIP must stay untouched to avoid mixing diffs.

## Effort

Workers: 0 until approval; then 0 Task workers (Hercules implements, Iolaus after UI diff).
Iolaus: after diff (required — marketing UI)

## Phases

1. Page tree + live hero record (no cinematic, no fake matchup).
2. One How-it-works pin + flattened `#record` + `#access` close; type/mobile/reduced-motion CSS.
3. Tests + visual receipts + Apple Craft Judge. Iolaus.

### Craft acceptance (apple-craft-director)

- Thesis: one live research record stays on screen; the page mutates it from matchup to grade
- First viewport: VouchEdge + one headline + one sentence + Get access + **live record**
- Motion: 3 beats above; reduce-motion: unpin
- Done = rubric PASS (all ≥ 4), not “looks like Meuze”

> [!IMPORTANT]
> **User Review Required**
>
> Reply **approve** (or lock it / go / execute) to start.
> Reply with changes to revise. I will not edit the product until you approve.
