# Landing HR Next Products Implementation Plan

Status: DONE
Slug: 2026-08-18-landing-hr-products
Repo: /Users/boydsantos/Desktop/Projects/Vouch/vouchres
Mode: FULL
Approved by: this-turn “okay now” / “we shall use the app’s actual products”
CONTEXT_STAMP: 2026-08-18. Memory MCP: EMPTY. Lessons: EMPTY on landing/HR; added L-landing-scroller-skill after skill install.

## Goal
Public landing proves **HR Next** (signed-in home) as the operational machine, using live `useResearchPreview` — not Meuze QSR copy, not a generic “research record” brochure.

## Craft brief
**Product / surface:** web marketing `/vouchedge-preview` + logged-out `/`
**Thesis:** One HR Next board stays on screen; four real products mutate it.
**Primary artifact:** live HR Next-shaped board (matchup + row + view chrome) from today’s feed.
**Brand:** VouchEdge wordmark. **VouchRes** once. Product names from the app: Live Games, HR Next, My List, Track Record.
**Motion:** 1) hero holds the board 2) one pin advances 01–04 3) By Game / Matrix toggle does not change box height.
**Reduce-motion / <768:** unpin; static steps.
**Type:** Space Grotesk / Cabinet Grotesk / JetBrains Mono.
**Non-goals:** ROI slider; Inter/Fraunces; importing `HrNextShell`; invented telemetry; three pins; auth-modal WIP.
**Designer:** apex-creative-engineer (Standard). **Acceptance:** apple-craft screenshots.

## Product map (scanned)

| App surface | Source of truth | Landing role |
|---|---|---|
| HR Next (`admin_hr_next`, `HR_NEXT_HOME`) | `HrNextPage` / `HrNextShell` | The one object. Views: By Tier, By Game, Flat Sort, Matrix |
| Live Games | launchpad + `useLiveGames` | Pillar 01 — ingest |
| HR Intelligence (`hr_board`) | launchpad | Related research; not a second pin |
| My List | `hrListStore` in HR Next | Pillar 03 |
| Track Record | `PRODUCT_WORKSPACES.track_record` | Pillar 04 |
| Today / Player Evidence / ParlayOS | launchpad | Named only if they appear; not extra movies |
| Integrations | MLB live feed + official results | “Replaces none of your sportsbook” |

## 6-phase spine
1. Hook — live chip + HR Next headline + Get access
2. Pin — Live Games → HR Next → My List → Track Record (same board)
3. Integrate — MLB feed / official results / sportsbook stays yours
4. Two-state — By Game vs Matrix, same box, live fields or `—`
5. Sizing — **omit** (`KILL:INVENTED_ROI`)
6. Access — Get access → Open HR Next → Save to My List → Read Track Record

## Files
- `src/pages/VouchEdgeLandingV3.tsx`
- `src/styles/vouchres-ultimate-truth-landing.css`
- `tests/publicLandingConversion.test.ts`

## Out of scope
Auth modal WIP. Cookie banner. `HrNextShell` import. Cinematic CSS cleanup. Commit.

## Risks
Eager-importing hr-next CSS/chunks. Copy claiming HR Next is public without login (it is signed-in home — landing inspects a public preview of the board, then Get access).
