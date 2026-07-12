import type { BrainFeatureSnapshot } from "./featureSchemas";
import { buildBrainTemporalContext } from "./temporalPolicy";

export const BRAIN_PITCHER_K_SELECTION_VERSION = "brain-pitcher-k-selection@1";
const PICK_TARGET = 10;
const PICK_LIMIT = 12;

function value(snapshot: BrainFeatureSnapshot, key: string): number {
  const candidate = snapshot.features[key];
  return typeof candidate === "number" && Number.isFinite(candidate) ? candidate : 0;
}

export function selectMlbPitcherKFeatures(snapshots: BrainFeatureSnapshot[], now = new Date()) {
  const ranked = snapshots
    .filter((snapshot) => snapshot.market === "pitcher_strikeouts" && snapshot.eligibility === "eligible")
    .filter((snapshot) => buildBrainTemporalContext({ now, observedAt: snapshot.observedAt, scheduledAt: snapshot.scheduledAt }).canSnapshot)
    .map((snapshot) => {
      const seasonKPer9 = value(snapshot, "seasonKPer9");
      const recentKAverage = value(snapshot, "recentKAverage");
      const starts = value(snapshot, "gamesStarted");
      const score = Math.round(Math.max(0, Math.min(100,
        seasonKPer9 * 6 + recentKAverage * 5 + Math.min(starts, 20) * 0.5 - snapshot.missingFeatures.length * 3,
      )));
      const confidence = Math.round(Math.max(35, Math.min(78, 48 + Math.min(starts, 20) + (recentKAverage ? 10 : 0) - snapshot.missingFeatures.length * 4)));
      return { snapshot, score, confidence };
    })
    .filter(({ snapshot, score }) => score >= 55 && value(snapshot, "seasonKPer9") >= 6.5)
    .sort((a, b) => b.score - a.score || b.confidence - a.confidence);

  const selected: Array<{ snapshot: BrainFeatureSnapshot; score: number; confidence: number; rank: number }> = [];
  const games = new Set<string>();
  for (const item of ranked) {
    if (games.has(item.snapshot.eventId)) continue;
    selected.push({ ...item, rank: selected.length + 1 });
    games.add(item.snapshot.eventId);
    if (selected.length >= PICK_LIMIT) break;
  }
  return selected.slice(0, Math.max(PICK_TARGET, Math.min(selected.length, PICK_LIMIT)));
}
