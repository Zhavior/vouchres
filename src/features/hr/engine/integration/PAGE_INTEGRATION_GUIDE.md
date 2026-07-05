# HR Engine — Page-by-Page Integration Guide

**Goal:** Every page in VouchEdge consumes the same `calculateHrPrediction()` engine. No more page-specific HR math.

**Architecture:**

```
                                  ┌─────────────────────┐
                                  │  HrDataProvider      │
                                  │  (Statcast/MLB API)  │
                                  └──────────┬──────────┘
                                             │
                                             ▼
                                  ┌─────────────────────┐
                                  │  calculateHrPrediction │
                                  │  (pure function)     │
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

---

## 1. HR Board Page (Section 13)

**Purpose:** Find the best HR targets today.

**Implementation:**

```tsx
// src/pages/HrBoardPage.tsx
import { calculateHrPredictionsBatch } from "../hr-engine/hrEngine";
import { HrCard } from "../hr-engine/HrCard";
import { dataProvider } from "../hr-engine/dataProvider";

export function HrBoardPage() {
  const [predictions, setPredictions] = useState<HrPrediction[]>([]);
  const [filter, setFilter] = useState<"all" | "elite" | "strong" | "sneaky" | "confirmed">("all");

  useEffect(() => {
    (async () => {
      const games = await dataProvider.getTodaysGames();
      const allInputs: HrEngineInputs[] = [];
      for (const game of games) {
        const hitterIds = await dataProvider.getHittersForGame(game.gameId);
        for (const hitterId of hitterIds) {
          const inputs = await dataProvider.getHrEngineInputs(hitterId, game.gameId);
          allInputs.push(inputs);
        }
      }
      const preds = calculateHrPredictionsBatch(allInputs);
      setPredictions(preds);
    })();
  }, []);

  const filtered = predictions.filter(p => {
    if (filter === "all") return true;
    if (filter === "elite") return p.tier.tier === "Elite";
    if (filter === "strong") return p.tier.tier === "Strong";
    if (filter === "sneaky") return p.tier.tier === "Sneaky";
    if (filter === "confirmed") return p.lineupScore.confirmed;
    return true;
  });

  return (
    <div>
      <h1>Today's HR Board</h1>
      <FilterBar value={filter} onChange={setFilter} />
      <div className="hr-board-grid">
        {filtered.map(p => (
          <HrCard key={p.playerId} prediction={p} variant="full" />
        ))}
      </div>
    </div>
  );
}
```

**Filter bar options (Section 13):**
- Elite HR Targets
- Strong HR Targets
- Sneaky HRs
- Lefty Power / Righty Power (filter by hitterHand)
- Wind Boost (filter by parkWeatherScore.windDirection === "out")
- Pitcher HR Vulnerable (filter by pitcherVulnerabilityScore.score >= 75)
- Confirmed Lineup Only (filter by lineupScore.confirmed)
- Top-of-Order Only (filter by lineupScore.lineupSpot <= 4)

---

## 2. AI Picks Page (Section 14)

**Purpose:** Show why the AI picked the player — full reasoning layers.

```tsx
// src/pages/AiPicksPage.tsx
export function AiPicksPage() {
  const [picks, setPicks] = useState<HrPrediction[]>([]);

  // Use the top 5 predictions from today's slate, filtered to "Strong" or better
  useEffect(() => {
    (async () => {
      const allInputs = await fetchTodaysInputs();
      const allPreds = calculateHrPredictionsBatch(allInputs);
      const topPicks = allPreds.filter(p => p.hrScore >= 70).slice(0, 5);
      setPicks(topPicks);
    })();
  }, []);

  return (
    <div>
      <h1>AI Picks</h1>
      <p className="disclaimer">Probability-based research. Not betting advice.</p>
      {picks.map(pick => (
        <div key={pick.playerId} className="ai-pick">
          <HrCard prediction={pick} variant="full" />
          <details className="ai-pick__why">
            <summary>Why this pick?</summary>
            <p>{pick.modelNote}</p>
          </details>
        </div>
      ))}
    </div>
  );
}
```

**Forbidden language (Section 24):** The HrCard component already enforces this — never use "lock," "guaranteed," "free money," "must bet," "sure hit," "safe parlay," "100%," or "can't miss."

**Required language:** "Probability-based target," "Model-supported lean," "High-upside HR candidate," "Risk-adjusted pick."

---

## 3. Parlay Scanner Page (Section 15)

**Purpose:** Help users understand if their parlay is realistic or lottery-level.

```tsx
// src/pages/ParlayScannerPage.tsx
import { scanParlay } from "../hr-engine/parlayScanner";

export function ParlayScannerPage() {
  const [selectedLegs, setSelectedLegs] = useState<HrPrediction[]>([]);
  const scan = scanParlay(selectedLegs);

  return (
    <div>
      <h1>Parlay Scanner</h1>

      <div className="parlay-builder">
        {/* Search and add legs */}
        <LegSearch onAdd={leg => setSelectedLegs([...selectedLegs, leg])} />
      </div>

      <div className="parlay-summary">
        <h2>{scan.riskLabel}</h2>
        <p>Combined probability: {(scan.combinedProbability * 100).toFixed(4)}%</p>
        <p>Leg quality: {scan.legQuality}</p>

        {scan.correlationWarning && (
          <div className="parlay-warning">{scan.correlationWarning}</div>
        )}
        {scan.overexposureWarning && (
          <div className="parlay-warning">{scan.overexposureWarning}</div>
        )}

        <p className="parlay-explanation">{scan.explanation}</p>
      </div>

      <div className="parlay-legs">
        {selectedLegs.map(leg => (
          <HrCard key={leg.playerId} prediction={leg} variant="compact" />
        ))}
      </div>
    </div>
  );
}
```

**Risk tier labels (Section 15):**
- Single HR: Reasonable Risk
- 2-Leg HR Parlay: High Risk
- 3-Leg HR Parlay: Very High Risk
- 4+ HR Parlay: Lottery Risk

---

## 4. Player Research Page (Section 17)

**Purpose:** Deep-dive on a single hitter.

```tsx
// src/pages/PlayerResearchPage.tsx
export function PlayerResearchPage({ playerId }: { playerId: string }) {
  const [prediction, setPrediction] = useState<HrPrediction | null>(null);
  const [historicalStats, setHistoricalStats] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const inputs = await dataProvider.getHrEngineInputs(playerId, todayGameId);
      const pred = calculateHrPrediction(inputs);
      setPrediction(pred);
      setHistoricalStats(await fetchPlayerHistoricalStats(playerId));
    })();
  }, [playerId]);

  if (!prediction) return <Loading />;

  return (
    <div>
      <h1>{prediction.playerName} — Research</h1>

      {/* Today's matchup prediction */}
      <HrCard prediction={prediction} variant="full" />

      {/* Power Profile section */}
      <section>
        <h2>Power Profile</h2>
        <p>Power Type: {getPowerType(prediction.hitterPowerScore)}</p>
        <p>ISO: {prediction.hitterPowerScore.iso.toFixed(3)}</p>
        <p>Barrel%: {(prediction.hitterPowerScore.barrelRate * 100).toFixed(1)}%</p>
        <p>Hard-Hit%: {(prediction.hitterPowerScore.hardHitRate * 100).toFixed(1)}%</p>
        <p>HR/FB: {(prediction.hitterPowerScore.hrFbRate * 100).toFixed(1)}%</p>
      </section>

      {/* Recent Contact section */}
      <section>
        <h2>Recent Contact</h2>
        <p>Trend: {prediction.barrelFormScore.label}</p>
        <p>Last 15 days Barrel%: {(prediction.barrelFormScore.last15BarrelRate * 100).toFixed(1)}%</p>
        <p>Last 7 days Barrel%: {(prediction.barrelFormScore.last7BarrelRate * 100).toFixed(1)}%</p>
      </section>

      {/* Pitch Type Damage section */}
      <section>
        <h2>Pitch Type Damage</h2>
        <p>Best pitch to damage: {prediction.pitchMixScore.bestMatchupPitch}</p>
        <p>Risk pitch: {prediction.pitchMixScore.riskPitch}</p>
        <p>Expected xSLG vs mix: {prediction.pitchMixScore.expectedXslg.toFixed(3)}</p>
      </section>

      {/* Handedness Splits section */}
      <section>
        <h2>Handedness Splits</h2>
        <p>Split edge: {prediction.handednessScore.splitEdge > 0 ? "+" : ""}{prediction.handednessScore.splitEdge.toFixed(3)} ISO</p>
        <p>{prediction.handednessScore.label}</p>
      </section>

      {/* Park Fit section */}
      <section>
        <h2>Park Fit</h2>
        <p>{prediction.parkWeatherScore.label}</p>
        <p>Park factor: {prediction.parkWeatherScore.parkMultiplier * 100}</p>
      </section>
    </div>
  );
}
```

**Player page should answer (Section 17):**
- Is this player a real HR threat today? → tier + score
- Is he hot or just lucky? → barrelFormScore.trend
- Does he match the pitcher's pitch mix? → pitchMixScore
- Does the park fit his batted-ball direction? → parkWeatherScore
- Is his lineup spot good? → lineupScore

---

## 5. Pitcher Lab Page (Section 18)

**Purpose:** Find pitchers to attack.

```tsx
// src/pages/PitcherLabPage.tsx
export function PitcherLabPage() {
  return (
    <div>
      <h1>Pitcher Lab — Who's Vulnerable</h1>
      <p>Find pitchers with elevated HR vulnerability.</p>

      {/* List of today's starting pitchers, sorted by vulnerability */}
      {pitchers.map(pitcher => (
        <PitcherVulnerabilityCard
          key={pitcher.id}
          pitcher={pitcher}
          topHrFits={pitcher.topHrFits}  // top 3 opposing hitters by HR score
        />
      ))}
    </div>
  );
}
```

**Pitcher card (Section 18):**
- Pitcher name
- HR Vulnerability score (0-100)
- Most Vulnerable To (LHB power / RHB power)
- Pitch Risk (which pitch type gets hammered)
- Danger Zone (location)
- Top 3 opposing HR fits (each links to that hitter's HrCard)

---

## 6. Game Research Page (Section 19)

**Purpose:** Find HR-friendly games.

**Game HR Environment Score formula:**

```
Game HR Environment =
  (Park HR Factor × 0.30)
  + (Weather HR Factor × 0.25)
  + (Starting Pitcher HR Weakness × 0.25)
  + (Bullpen HR Weakness × 0.10)
  + (Lineup Power Density × 0.10)
```

```tsx
// src/pages/GameResearchPage.tsx
export function GameResearchPage() {
  const games = useTodaysGames();

  const gameEnvironments = games.map(game => {
    const pitcherVuln = calculatePitcherVulnerabilityScore(game.pitcher.vulnerability);
    const parkWeather = calculateParkWeatherScore(game.parkWeather);
    const bullpen = calculateBullpenScore(game.bullpen);
    const lineupPower = calculateLineupPowerDensity(game.lineup);

    const envScore =
      (parkWeather.parkMultiplier * 100 - 100) * 0.30 +
      (parkWeather.weatherMultiplier * 100 - 100) * 0.25 +
      (pitcherVuln.score - 50) * 0.25 +
      (bullpen.multiplier * 100 - 100) * 0.10 +
      (lineupPower - 50) * 0.10 + 50;

    return { ...game, envScore, pitcherVuln, parkWeather, bullpen, lineupPower };
  }).sort((a, b) => b.envScore - a.envScore);

  return (
    <div>
      <h1>Game Research</h1>
      {gameEnvironments.map(game => (
        <GameEnvironmentCard key={game.id} game={game} />
      ))}
    </div>
  );
}
```

**Game card (Section 19):**
- Game HR Environment score (0-100)
- Run Environment: High / Average / Pitcher's Duel
- HR Environment: Strong / Average / Suppressed
- Best HR Side (which team has more power)
- Top HR Fits (top 3 hitters from either team)

---

## 7. Notifications Page (Section 20)

**Purpose:** Alerts driven by math, not spam.

```tsx
// src/pages/NotificationsPage.tsx
import { comparePredictions } from "../hr-engine/notificationRules";

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<HrNotification[]>([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      // Refresh predictions every 5 minutes
      const newPredictions = await refreshTodaysPredictions();
      const newNotifs: HrNotification[] = [];

      for (const newPred of newPredictions) {
        const oldPred = previousPredictionsRef.current.get(newPred.playerId) ?? null;
        const isSaved = savedPickIds.has(newPred.playerId);
        const isParlayLeg = parlayLegIds.has(newPred.playerId);

        const notifs = comparePredictions(oldPred, newPred, {
          isSavedPick: isSaved,
          isParlayLeg: isParlayLeg,
        });
        newNotifs.push(...notifs);
      }

      if (newNotifs.length > 0) {
        setNotifications(prev => [...newNotifs, ...prev].slice(0, 100));
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1>Notifications</h1>
      {notifications.map(n => <NotificationCard key={n.id} notification={n} />)}
    </div>
  );
}
```

**Notification types (Section 20):**
- 🚀 HR Boost Alert — score jumped above 80
- ✅ Lineup Confirmed — top HR candidate's lineup confirmed
- 🌬️ Wind-Out Boost — weather shifted favorably
- 🔄 Pitcher Change — opposing pitcher changed
- 🔥 Bullpen Alert — vulnerable bullpen entering
- ⚠️ Risk Alert — saved pick got riskier
- 🚨 Parlay Leg Inactive — parlay leg became inactive

---

## 8. Results / Grading Page (Section 21)

**Purpose:** Grade picks based on PROCESS, not just result.

```tsx
// src/pages/ResultsPage.tsx
import { calculateProcessScore } from "../hr-engine/processScore";

export function ResultsPage() {
  const gradedPicks = useGradedPicks();

  return (
    <div>
      <h1>Results</h1>
      {gradedPicks.map(outcome => {
        const process = calculateProcessScore(outcome);
        return (
          <div key={outcome.prediction.id} className="result-card">
            <HrCard prediction={outcome.prediction} variant="compact" showActions={false} />

            <div className="result-card__outcome">
              <span className={`result-badge result-badge--${outcome.result}`}>
                {outcome.result.toUpperCase()}
              </span>
              <span className="process-label">{process.label}</span>
            </div>

            <div className="result-card__process">
              <p>Process Score: {process.score.toFixed(0)}/100</p>
              <p>Contact Quality: {process.contactQuality}</p>
              <p>Pre-game Score: {process.preGameScore.toFixed(0)}/100</p>
              <p>Final Probability: {(process.finalProbability * 100).toFixed(1)}%</p>
            </div>

            <p className="result-card__review">{process.modelReview}</p>
          </div>
        );
      })}
    </div>
  );
}
```

**Process labels (Section 21):**
- Good Process / Good Result
- Good Process / Bad Result
- Bad Process / Bad Result
- Lucky Win

---

## 9. User Profile Page (Section 22)

**Purpose:** Show context, not just win rate.

```tsx
// src/pages/ProfilePage.tsx
import { calculateProfileStats } from "../hr-engine/profileStats";

export function ProfilePage({ userId }: { userId: string }) {
  const outcomes = useUserPickOutcomes(userId);
  const stats = calculateProfileStats(outcomes);

  return (
    <div>
      <h1>Profile</h1>

      <div className="profile-stats">
        <StatCard label="HR Picks Posted" value={stats.totalHrPicks} />
        <StatCard label="HR Hit Rate" value={`${(stats.hrHitRate * 100).toFixed(1)}%`} />
        <StatCard label="Average Pick Score" value={stats.averagePickScore.toFixed(0)} />
        <StatCard label="Good Process Rate" value={`${(stats.goodProcessRate * 100).toFixed(0)}%`} />
        <StatCard label="ROI" value={`${(stats.roi * 100).toFixed(1)}%`} />
        <StatCard label="Lottery Parlays" value={stats.lotteryParlays} />
        <StatCard label="Parlay Behavior" value={stats.parlayRiskBehavior} />
      </div>

      <h2>Hit Rate by Tier</h2>
      <TierHitRateTable hitRateByTier={stats.hitRateByTier} />

      <p className="profile-note">
        {stats.bestTier && `Best tier: ${stats.bestTier} HR targets`}
        {stats.worstTier && ` · Worst tier: ${stats.worstTier}`}
      </p>
    </div>
  );
}
```

**Profile stats (Section 22):**
- HR Picks Posted
- HR Hit Rate (with context: HRs are rare)
- Average Pick Score
- Hit Rate by Tier
- Best/Worst Tier
- Good Process Rate
- Lottery Parlays
- Parlay Risk Behavior
- ROI

---

## 10. Dashboard Page (Section 23)

**Purpose:** Daily summary.

```tsx
// src/pages/DashboardPage.tsx
export function DashboardPage() {
  const todaysPredictions = useTodaysPredictions();
  const games = useTodaysGames();

  const topTargets = todaysPredictions
    .filter(p => p.hrScore >= 80)
    .slice(0, 5);

  const sneakyTargets = todaysPredictions
    .filter(p => p.tier.tier === "Sneaky")
    .slice(0, 3);

  const vulnerablePitchers = games
    .map(g => ({ pitcher: g.awayPitcher, vulnerability: g.pitcherVulnerability }))
    .sort((a, b) => b.vulnerability.score - a.vulnerability.score)
    .slice(0, 3);

  const hrFriendlyGames = games
    .map(g => ({ ...g, envScore: calculateGameEnv(g) }))
    .sort((a, b) => b.envScore - a.envScore)
    .slice(0, 3);

  return (
    <div>
      <h1>Today's Dashboard</h1>

      <section>
        <h2>🚀 Today's Best HR Targets</h2>
        {topTargets.map(p => <HrCard key={p.playerId} prediction={p} variant="compact" />)}
      </section>

      <section>
        <h2>🎯 Sneaky HR Candidates</h2>
        {sneakyTargets.map(p => <HrCard key={p.playerId} prediction={p} variant="compact" />)}
      </section>

      <section>
        <h2>⚠️ Most Vulnerable Pitchers</h2>
        {vulnerablePitchers.map(p => <PitcherCard key={p.pitcher.id} pitcher={p} />)}
      </section>

      <section>
        <h2>🏟️ HR-Friendly Games</h2>
        {hrFriendlyGames.map(g => <GameCard key={g.id} game={g} />)}
      </section>
    </div>
  );
}
```

---

## 11. Vouch Cards / Social Posts (Section 16)

**Purpose:** Beautiful card generation for shares.

```tsx
// src/components/VouchShareCard.tsx
import { generateVouchCard, generateParlayVouchCard } from "../hr-engine/vouchCardGenerator";

export function VouchShareCard({ prediction }: { prediction: HrPrediction }) {
  const card = generateVouchCard(prediction);

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(card.shareText)}`;
    window.open(url, "_blank");
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(card.cardText);
  };

  return (
    <div className="vouch-share-card">
      <pre className="vouch-share-card__text">{card.cardText}</pre>
      <div className="vouch-share-card__actions">
        <button onClick={handleShareTwitter}>Share on X</button>
        <button onClick={handleCopyText}>Copy text</button>
      </div>
    </div>
  );
}
```

For image-based cards (for Twitter image shares), use the `cardText` field with a card-rendering library like `@vercel/og` or `html-to-image`.

---

## 12. Notification Realtime Refresh (Section 20)

**Pattern:** Refresh predictions every 5 minutes; diff against previous; emit notifications.

```ts
// src/lib/notificationRefresher.ts
import { comparePredictions } from "../hr-engine/notificationRules";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function startNotificationRefreshLoop(options: {
  savedPickIds: Set<string>;
  parlayLegIds: Set<string>;
  onNotifications: (notifs: HrNotification[]) => void;
}) {
  let previousPredictions = new Map<string, HrPrediction>();

  const interval = setInterval(async () => {
    const newPredictions = await refreshTodaysPredictions();
    const newNotifs: HrNotification[] = [];

    for (const newPred of newPredictions) {
      const oldPred = previousPredictions.get(newPred.playerId) ?? null;
      const notifs = comparePredictions(oldPred, newPred, {
        isSavedPick: options.savedPickIds.has(newPred.playerId),
        isParlayLeg: options.parlayLegIds.has(newPred.playerId),
      });
      newNotifs.push(...notifs);
    }

    // Update previous map
    previousPredictions = new Map(newPredictions.map(p => [p.playerId, p]));

    if (newNotifs.length > 0) {
      options.onNotifications(newNotifs);
    }
  }, REFRESH_INTERVAL_MS);

  return () => clearInterval(interval);
}
```

---

## Migration Plan (from existing VouchEdge code)

1. **Copy `hr-engine/` folder** into your project at `src/hr-engine/` (or `server/hr-engine/` if you want it server-side only — recommended for production so users can't tamper).

2. **Replace `server/services/intelligence/hrEngine.ts`** with calls to the new engine:
   ```ts
   // OLD:
   // import { calculateHrScore } from "../intelligence/hrEngine";

   // NEW:
   import { calculateHrPrediction } from "../../hr-engine/hrEngine";
   ```

3. **Replace `server/services/intelligence/pitcherVulnerabilityEngine.ts`** with the new `pitcherVulnerabilityScore.ts`.

4. **Replace `server/services/intelligence/parlayEngine.ts`** with `parlayScanner.ts`.

5. **Wire `HrCard` component** into every page that currently has HR pick display:
   - `DailyHrBoardPage.tsx`
   - `TodayDashboard.tsx`
   - `MlbIntelligenceHub.tsx`
   - `ParlayLab.tsx`
   - `PlayerResearchConsole.tsx`
   - `ResultsPage.tsx`
   - `ProfilePage.tsx`
   - `FeedPostCard.tsx` (for posts with attached picks)
   - `VouchCard.tsx` (use `VouchShareCard`)

6. **Delete old HR math files** once the new engine is wired:
   - `server/services/intelligence/hrEngine.ts`
   - `server/services/intelligence/hrEdgeEngine.ts`
   - `server/services/intelligence/pitcherVulnerabilityEngine.ts`
   - `server/services/intelligence/parlayEngine.ts`

7. **Run tests:**
   ```bash
   npx vitest run hr-engine/
   ```

8. **Calibrate constants** in `constants.ts` against real MLB data. Run the engine on a historical slate, compare predicted probabilities to actual hit rates, and tune until elite targets hit ~10%, strong ~8%, etc.

---

## Why this architecture matters

Before: every page had its own HR math. The HR Board showed one score, the AI Picks page showed a different score for the same player, and the Vouch Card showed yet another. Users lost trust.

After: every page calls `calculateHrPrediction(inputs)` and gets the same answer. The score on the HR Board matches the score on the AI Picks page matches the score on the Vouch Card. Users trust the math because it's consistent.

Plus: changes to the formula (e.g., tuning the Poisson multiplier) automatically propagate to every page. One code change, eleven pages updated.
