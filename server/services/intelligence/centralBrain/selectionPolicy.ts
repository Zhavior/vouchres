import type { BrainFeatureSnapshot } from "./featureSchemas";
import { buildBrainTemporalContext } from "./temporalPolicy";

export const BRAIN_HR_SELECTION_VERSION = "brain-hr-selection@2";
const PICK_TARGET = 10;
const PICK_LIMIT = 12;

export interface SelectedBrainFeature {
  snapshot: BrainFeatureSnapshot;
  score: number;
  rank: number;
}

function numberFeature(snapshot: BrainFeatureSnapshot, key: string, fallback: number): number {
  const value = snapshot.features[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function selectMlbHrFeatures(
  snapshots: BrainFeatureSnapshot[],
  now = new Date(),
): SelectedBrainFeature[] {
  const ranked = snapshots
    .filter((snapshot) => snapshot.sport === "mlb" && snapshot.market === "home_run")
    .filter((snapshot) => snapshot.eligibility !== "blocked")
    .filter((snapshot) => buildBrainTemporalContext({ now, observedAt: snapshot.observedAt, scheduledAt: snapshot.scheduledAt }).canSnapshot)
    .map((snapshot) => {
      const score = clamp(
        numberFeature(snapshot, "rawHrScore", 0) * 0.45 +
        numberFeature(snapshot, "hitterPower", numberFeature(snapshot, "rawHrScore", 0)) * 0.18 +
        numberFeature(snapshot, "pitcherVulnerability", 50) * 0.18 +
        numberFeature(snapshot, "recentForm", 50) * 0.1 +
        numberFeature(snapshot, "dataConfidence", 0) * 0.09 -
        (snapshot.eligibility === "eligible" ? 0 : 7),
      );
      return { snapshot, score };
    })
    .filter(({ snapshot, score }) => score >= 55 && numberFeature(snapshot, "dataConfidence", 0) >= 55)
    .sort((a, b) => b.score - a.score || b.snapshot.subjectLabel.localeCompare(a.snapshot.subjectLabel));

  const official = ranked.filter(({ snapshot }) => snapshot.eligibility === "eligible");
  const pool = official.length >= PICK_TARGET ? official : ranked;
  const gameCounts = new Map<string, number>();
  const teamCounts = new Map<string, number>();
  const selected: SelectedBrainFeature[] = [];

  for (const maxPerTeam of [1, 2]) {
    for (const item of pool) {
      if (selected.some((entry) => entry.snapshot.subjectId === item.snapshot.subjectId)) continue;
      if ((gameCounts.get(item.snapshot.eventId) ?? 0) >= 2) continue;
      if ((teamCounts.get(item.snapshot.team) ?? 0) >= maxPerTeam) continue;
      selected.push({ ...item, rank: selected.length + 1 });
      gameCounts.set(item.snapshot.eventId, (gameCounts.get(item.snapshot.eventId) ?? 0) + 1);
      teamCounts.set(item.snapshot.team, (teamCounts.get(item.snapshot.team) ?? 0) + 1);
      if (selected.length >= PICK_LIMIT) break;
    }
    if (selected.length >= PICK_TARGET) break;
  }
  return selected;
}
