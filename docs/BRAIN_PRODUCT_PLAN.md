# Brain → Working Product Plan

VouchEdge Brain (ProjectVABrAIns) is a deterministic MLB decision ledger: scan evidence → select → freeze → settle → optional Gemini explain-only. This plan turns that architecture into a trust-first product people can rely on, measured the way serious forecasters measure themselves.

## Research analogs (what we steal and what we reject)

| Analog | What they do well | Apply to Brain | Reject |
| --- | --- | --- | --- |
| **PropsBot** | Public timestamped prop ledger + Brier vs Vegas closing line; says when a sport is *not* beating the market | Publish every freeze with decision key, engine version, source age; show Brier / hit-rate with sample warnings | Vanity win-rate without probabilities or baselines |
| **FiveThirtyEight / forecasting practice** | Calibration & skill over raw accuracy; Brier decompositions | Prefer calibration + reliability diagrams once settled N is large enough | Ranking players by uncalibrated score as if it were a fair price |
| **Sports calibration literature** (proper scoring, ECE, isotonic) | Probabilities must mean what they say for Kelly/sizing | Stage 2+: store `estimatedProbability` on freeze; ECE by market; refuse to promote models that look accurate but are miscalibrated | Training an LLM to invent confidence |
| **Action Network** | Expert/model blend vs market; edge + letter grades; projections update pre-lock | Stage 3: edge vs book only when book odds are real; letter grade as UI sugar on calibrated edge | Fabricating odds or “A grades” without a book line |
| **Swish / official-data props shops** | Authorized live data, lock discipline, micro-markets later | Stay on MLB Stats API truth gates; lock before start; live markets *after* pregame ledger works | Microbetting before freeze/settle/calibration is boringly solid |

Product thesis from this research: **Brain wins by being an honest, immutable, calibratable ledger**—not by sounding smarter than the board.

## Current product gaps (deep scan)

1. **Dual math on HR Picks UI** — client `selectBrainPicks` still ranks the board, then intersects with the server ledger → empty or mismatched lists.
2. **Ops freshness spoof** — `executeBrainOperations` sets `observedAt = now`, so cron “succeeds” into the window while selection filters on real `board.debug.lastRefresh` and produces **empty freezes**.
3. **Pitcher K overclaims** — probable starters marked `eligible` / `official`; ledger hardcodes `evidence_quality: "official"`.
4. **Learning loop incomplete** — settle exists; promotion of engines from calibration is not a closed product loop.
5. **Adoption incomplete** — HR Intelligence / ParlayOS not fully bound to decision IDs (see `CENTRAL_BRAIN_ARCHITECTURE.md`).

## Stages

### Stage 0 — Trust & publish reliability (foundation)

Already largely shipped via prior ops/auth/CI/soak work. Keep green:

- Health, cron auth, CORS, Sentry boot, staff envReady
- No fake lineups / odds / injuries
- Confirmed → `candidates[]`; projected → `projectedCandidates[]` with warning

**Exit:** Production smoke green; Brain cron can run without auth/boot lies.

### Stage 1 — Single source of truth + evidence honesty (this PR)

Make freeze → UI → evidence labels tell the same story.

1. **HR Picks UI** reads server ledger only; board rows enrich display (headshot, pitcher, venue, layer scores).
2. **Ops gate** uses HR board `lastRefresh` (and schedule status) as `observedAt`, matching scan/selection so we do not pretend stale boards are fresh.
3. **Pitcher K** treats probable pitchers as **preview** evidence; selection accepts preview with penalty; ledger `evidence_quality` follows eligibility.

**Exit:** UI never invents an HR shortlist the ledger did not freeze; empty freezes are explained by genuine window/staleness; pitcher K never called “official lineup/starter.”

### Stage 2 — Calibration ledger productization

Make Brain measurable like PropsBot / forecasting literature.

- Surface per-market performance (hit/miss/void, sample warning) on Results + staff
- Persist predicted probability on freeze where engines have it
- Publish Brier (and later ECE) vs naive baselines; never hide small N
- Close learning → evaluation → engine version promotion with explicit gates

**Exit:** A stranger can see what Brain froze, when, at which version, and how it settled—without trusting marketing copy.

### Stage 3 — Feature completeness (truthful markets)

Wire only sourced features; delete dead dual paths.

- Steal: Statcast sprint / catcher / pitcher delivery when a real provider exists; keep “evidence limited” until then
- Pitcher K: opposing lineup K rate, swinging-strike, pitch-count projection
- HR: weather only with a connected provider
- Remove unused client dual-select paths (`pitcherKSelection` UI path, unused `/mlb/daily` if still orphaned)

**Exit:** Missing features remain missing in the UI; no silent neutral fill.

### Stage 4 — Product adoption + observability

- HR Intelligence / Daily Players / ParlayOS consume decision IDs + engine versions
- OTel spans for ingest → adapter → select → freeze → settle
- Drift alerts on missing-feature rates and calibration (Evidently-class checks when volume justifies)

**Exit:** Brain is the upstream contract for surfaces that claim Brain-backed picks.

## Execution order (improve, then expand)

```text
Stage 0 (done) → Stage 1 (now) → Stage 2 (measure) → Stage 3 (features) → Stage 4 (adopt)
```

Do not expand markets or sports until Stage 1–2 exit criteria hold. Calibration without an honest freeze is fiction; features without calibration are noise.

## Non-negotiables (from AGENTS.md + architecture)

- Deterministic engines own scores; Gemini is explain-only
- Never upgrade projected → confirmed
- Team mismatch / stale roster → blocked, never `candidates[]`
- Pages do not recalculate Brain math
