# VouchEdge HR Engine

**The math that powers every page.**

```
λ = Expected PA × Contact Rate × FB% × Regressed HR/FB%
    × Park HR Factor × Weather Factor × Pitch Mix Factor
    × Handedness Factor × Pitcher HR Weakness Factor
    × Lineup Factor × Bullpen Factor

HR Probability = 1 - e^(-λ)

VouchEdge HR Score =
  (Hitter Power Score × 0.25)
  + (Barrel Form Score × 0.20)
  + (Pitcher Vulnerability Score × 0.20)
  + (Pitch Mix Matchup Score × 0.15)
  + (Park/Weather Score × 0.10)
  + (Lineup Context Score × 0.05)
  + (Bullpen Weakness Score × 0.05)
  - Strikeout Penalty
```

## Quickstart

```ts
import { calculateHrPrediction } from "./hrEngine";
import { AARON_JUDGE_INPUTS } from "./mockData";

const prediction = calculateHrPrediction(AARON_JUDGE_INPUTS);

console.log(prediction.hrScore);           // 87.3
console.log(prediction.hrProbability);     // 0.084
console.log(prediction.tier.label);        // "Strong HR Target"
console.log(prediction.confidence.level);  // "High"
console.log(prediction.topReasons);
// [
//   "✅ Elite barrel profile (16.5% Barrel%, .318 ISO)",
//   "✅ Pitcher allows elevated contact (1.42 HR/9, 9.2% Barrel allowed)",
//   "✅ 🚀 Carry Boost + 🌬️ Wind Out (+17.5% carry)"
// ]
console.log(prediction.risks);
// ["⚠️ 4.9% K penalty — 27% K rate vs high-K pitcher"]
console.log(prediction.modelNote);
// "Aaron Judge is a Strong HR Target today.
//  Main reasons:
//  1. Elite barrel profile (16.5% Barrel%, .318 ISO)
//  ..."
```

## Files

| File | Purpose | Spec section |
|------|---------|--------------|
| `types.ts` | All TypeScript interfaces | §26 |
| `constants.ts` | League averages, weights, multipliers (tunable) | §1-12 |
| `regression.ts` | Bayesian shrinkage for small samples | §12 |
| `hitterPowerScore.ts` | Hitter power profile | §3 |
| `barrelFormScore.ts` | Recent form (15d / 7d weighted) | §4 |
| `pitcherVulnerabilityScore.ts` | Pitcher HR weakness | §5 |
| `pitchMixScore.ts` | Pitch-type matchup edge | §6 |
| `handednessScore.ts` | LHP/RHP split multiplier | §7 |
| `parkWeatherScore.ts` | Park factor + weather boost | §8 |
| `lineupScore.ts` | Lineup spot multiplier | §9 |
| `bullpenScore.ts` | Bullpen weakness (late-game PAs) | §10b |
| `strikeoutPenalty.ts` | K-rate penalty | §10 |
| `confidence.ts` | Confidence multiplier | §11 |
| `tiers.ts` | Score → tier assignment | §2 |
| `reasons.ts` | Top reasons + risks + narrative | §25 |
| **`hrEngine.ts`** | **Main orchestrator — call this** | §1, §2 |
| `parlayScanner.ts` | Multi-leg parlay math | §15 |
| `vouchCardGenerator.ts` | Social share card text | §16 |
| `notificationRules.ts` | Math-driven alerts | §20 |
| `processScore.ts` | Good process / bad result grading | §21 |
| `profileStats.ts` | HR-specific user metrics | §22 |
| `dataProvider.ts` | Real-data fetcher interface | — |
| `mockData.ts` | Test fixtures (Judge, Soto, weak hitter) | — |
| `HrCard.tsx` | Universal card component | §28 |
| `engine.test.ts` | Unit tests | — |
| `integration/PAGE_INTEGRATION_GUIDE.md` | Wire into all 11 pages | §13-23 |

## Architecture

```
                                  ┌─────────────────────┐
                                  │  HrDataProvider      │
                                  │  (Statcast/MLB API)  │
                                  └──────────┬──────────┘
                                             │
                                             ▼
                                  ┌─────────────────────┐
                                  │ calculateHrPrediction│
                                  │  (pure function)    │
                                  └──────────┬──────────┘
                                             │
                       ┌─────────────────────┼─────────────────────┐
                       │                     │                     │
                       ▼                     ▼                     ▼
                ┌────────────┐        ┌────────────┐        ┌────────────┐
                │  HrCard    │        │ parlayScan │        │ processScore│
                │ component  │        │            │        │            │
                └─────┬──────┘        └─────┬──────┘        └─────┬──────┘
                      │                     │                     │
       ┌──────────────┼──────────────┐      │                     │
       │              │              │      │                     │
       ▼              ▼              ▼      ▼                     ▼
   HR Board      AI Picks      Player    Parlay             Results page
   Game Research Pitcher Lab   Research  Scanner            Profile page
   Dashboard     Notifications            Vouch Cards
```

**Key principle:** Every page calls `calculateHrPrediction()` and gets the same answer. The score on the HR Board matches the AI Picks page matches the Vouch Card. One formula, eleven pages.

## The math, explained

### Poisson model (Section 1)

HRs in a single game follow approximately a Poisson distribution. If λ is the expected number of HRs, then:

- P(0 HR) = e^(-λ)
- P(1+ HR) = 1 - e^(-λ) ← **this is what we display**

### Computing λ

The baseline λ comes from the hitter's underlying stats:

```
baseline_λ = Expected_PA × Contact_Rate × FB% × Regressed_HR/FB
```

Then multipliers scale it:

| Multiplier | Source | Range |
|------------|--------|-------|
| Park HR Factor | park factor / 100 | 0.85–1.20 |
| Weather Factor | temp + wind + precip | 0.80–1.25 |
| Pitch Mix Factor | expected xSLG vs pitcher's mix | 0.85–1.15 |
| Handedness Factor | platoon split | 0.90–1.10 |
| Pitcher Weakness Factor | pitcher vulnerability score | 0.80–1.30 |
| Lineup Factor | batting order spot | 0.88–1.08 |
| Bullpen Factor | bullpen HR/9 + fatigue | 0.85–1.20 |

Combined λ = baseline × all multipliers.

### Regression (Section 12)

Small samples get shrunk toward the league mean:

```
Regressed HR/FB = (Player_HR/FB × Player_FB + League_HR/FB × 100)
                  / (Player_FB + 100)
```

A hitter with 25% HR/FB on 40 fly balls regresses to 15.7% (closer to the 12.2% league average).

This prevents fake hot streaks from inflating scores.

### Composite score (Section 2)

The 0-100 score users see is a weighted blend:

```
HR Score = (Hitter Power × 0.25)
         + (Barrel Form × 0.20)
         + (Pitcher Vulnerability × 0.20)
         + (Pitch Mix × 0.15)
         + (Park/Weather × 0.10)
         + (Lineup × 0.05)
         + (Bullpen × 0.05)
         - K Penalty
```

Then multiplied by the confidence multiplier (0.65–1.00).

### Tier assignment (Section 2)

| Score | Tier | Label |
|-------|------|-------|
| 90-100 | Elite | Elite HR Target |
| 80-89 | Strong | Strong HR Target |
| 70-79 | Good | Good HR Target |
| 60-69 | Sneaky | Sneaky HR Target |
| <60 | Avoid | Weak / Avoid |

## Calibration

The constants in `constants.ts` are starting points. **You must calibrate against real MLB data before going live:**

1. Run the engine on every game from the 2024 season
2. Compare predicted probabilities to actual hit rates by tier
3. Adjust multipliers in `constants.ts` until:
   - Elite tier (90+ score) → ~10% actual HR hit rate
   - Strong tier (80-89) → ~8%
   - Good tier (70-79) → ~6%
   - Sneaky tier (60-69) → ~4%
   - Avoid (<60) → ~2%

4. Re-run tests after each tuning pass

```bash
npx vitest run hr-engine/engine.test.ts
```

## Data sources

The `dataProvider.ts` interface expects:

| Data | Source | Cost |
|------|--------|------|
| Statcast barrel/hard-hit/xSLG | baseballsavant.mlb.com | Free |
| FanGraphs ISO/HR-FB/splits | fangraphs.com | Free (scraping) or paid API |
| MLB Stats API (lineups/weather) | statsapi.mlb.com | Free |
| Park factors | FanGraphs | Free |
| Weather | openweathermap.org | Free tier |

For beta, MLB Stats API + Statcast is enough. Add FanGraphs later for full splits coverage.

## Language rules (Section 24)

**NEVER use:** "lock," "Lock," "guaranteed," "Guaranteed," "free money," "must bet," "sure hit," "safe parlay," "100%," "can't miss"

**USE INSTEAD:**
- "Probability-based target"
- "Model-supported lean"
- "High-upside HR candidate"
- "Risk-adjusted pick"
- "Strong profile"
- "Edge detected"

The `SAFE_LANGUAGE` constant in `constants.ts` is enforced by the `reasons.ts` generator — it will never produce forbidden words.

## Disclaimer

Every prediction, every card, every notification includes:

> Probability-based research for entertainment only. Not betting advice. Past performance does not guarantee future results.

Stored in `constants.ts` as `DISCLAIMER`.

## Testing

```bash
# Unit tests
npx vitest run hr-engine/

# With coverage
npx vitest run hr-engine/ --coverage

# Watch mode
npx vitest hr-engine/
```

Tests verify:
- Elite hitters (Judge) score 70+
- Weak hitters score <60
- Regression shrinks small samples toward league mean
- Parlay math compounds correctly
- K penalty reduces score
- Wind-out boosts probability
- No forbidden gambling language appears anywhere

## Migration from existing VouchEdge HR code

See `integration/PAGE_INTEGRATION_GUIDE.md` for the full migration plan.

The TL;DR:

1. Copy `hr-engine/` into `src/hr-engine/` (or `server/hr-engine/` for server-only)
2. Replace calls to old `server/services/intelligence/hrEngine.ts` with `calculateHrPrediction()`
3. Replace `parlayEngine.ts` with `parlayScanner.ts`
4. Replace `pitcherVulnerabilityEngine.ts` with `pitcherVulnerabilityScore.ts`
5. Wire `HrCard` component into every page that displays picks
6. Delete old HR math files
7. Run tests
8. Calibrate constants against real data

## Philosophy (Section 30)

> The app is not guessing. The app is explaining.

Every page answers:
- Why this player?
- Why this pitcher?
- Why this game?
- Why this score?
- What are the risks?
- How confident is the model?
- Did the result match the process?

That's how VouchEdge becomes more than a picks app. It becomes a sports research engine.
