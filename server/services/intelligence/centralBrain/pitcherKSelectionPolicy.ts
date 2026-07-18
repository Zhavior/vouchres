import type { BrainFeatureSnapshot } from "./featureSchemas";
import type { BrainSelectionMode, BrainSelectionOptions } from "./selectionPolicy";
import { buildBrainTemporalContext } from "./temporalPolicy";

export const BRAIN_PITCHER_K_SELECTION_VERSION = "brain-pitcher-k-selection@1";
const PICK_TARGET = 10;
const PICK_LIMIT = 12;

function value(snapshot: BrainFeatureSnapshot, key: string): number {
  const candidate = snapshot.features[key];
  return typeof candidate === "number" && Number.isFinite(candidate) ? candidate : 0;
}

function passesTemporalGate(snapshot: BrainFeatureSnapshot, now: Date, mode: BrainSelectionMode): boolean {
  const context = buildBrainTemporalContext({
    now,
    observedAt: snapshot.observedAt,
    scheduledAt: snapshot.scheduledAt,
  });
  return mode === "monitoring" ? context.canMonitor : context.canSnapshot;
}

export function selectMlbPitcherKFeatures(
  snapshots: BrainFeatureSnapshot[],
  now = new Date(),
  options: BrainSelectionOptions = {},
) {
  const mode = options.mode ?? "decision";
  const minScore = mode === "monitoring" ? 50 : 55;
  const minKPer9 = mode === "monitoring" ? 6.0 : 6.5;

  const ranked = snapshots
    .filter((snapshot) => snapshot.market === "pitcher_strikeouts" && snapshot.eligibility === "eligible")
    .filter((snapshot) => passesTemporalGate(snapshot, now, mode))
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
    .filter(({ snapshot, score }) => score >= minScore && value(snapshot, "seasonKPer9") >= minKPer9)
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
