import type { BrainFeatureSnapshot } from "./featureSchemas";
import { buildBrainTemporalContext } from "./temporalPolicy";

export const BRAIN_SB_SELECTION_VERSION = "brain-stolen-base-selection@1";
const PICK_TARGET = 10;
const PICK_LIMIT = 12;

function value(snapshot: BrainFeatureSnapshot, key: string): number {
  const candidate = snapshot.features[key];
  return typeof candidate === "number" && Number.isFinite(candidate) ? candidate : 0;
}

export function selectMlbStolenBaseFeatures(snapshots: BrainFeatureSnapshot[], now = new Date()) {
  const ranked = snapshots
    .filter((snapshot) => snapshot.market === "stolen_base" && snapshot.eligibility !== "blocked")
    .filter((snapshot) => buildBrainTemporalContext({ now, observedAt: snapshot.observedAt, scheduledAt: snapshot.scheduledAt }).canSnapshot)
    .map((snapshot) => {
      const score = Math.round(Math.max(0, Math.min(100,
        value(snapshot, "attemptsPerGame") * 170 +
        value(snapshot, "stealSuccessRate") * 25 +
        value(snapshot, "recentAttempts") * 5 +
        value(snapshot, "onBasePercentage") * 25 -
        (snapshot.eligibility === "eligible" ? 0 : 8),
      )));
      return { snapshot, score };
    })
    .filter(({ snapshot, score }) => score >= 50 && value(snapshot, "seasonStolenBases") >= 2)
    .sort((a, b) => b.score - a.score);

  const selected: Array<{ snapshot: BrainFeatureSnapshot; score: number; rank: number }> = [];
  const games = new Map<string, number>();
  const teams = new Map<string, number>();
  for (const maxPerTeam of [1, 2]) {
    for (const item of ranked) {
      if (selected.some((entry) => entry.snapshot.subjectId === item.snapshot.subjectId)) continue;
      if ((games.get(item.snapshot.eventId) ?? 0) >= 2 || (teams.get(item.snapshot.team) ?? 0) >= maxPerTeam) continue;
      selected.push({ ...item, rank: selected.length + 1 });
      games.set(item.snapshot.eventId, (games.get(item.snapshot.eventId) ?? 0) + 1);
      teams.set(item.snapshot.team, (teams.get(item.snapshot.team) ?? 0) + 1);
      if (selected.length >= PICK_LIMIT) break;
    }
    if (selected.length >= PICK_TARGET) break;
  }
  return selected;
}
