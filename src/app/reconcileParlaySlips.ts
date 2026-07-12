import type { Parlay } from '../types';

const UNSYNCED_RETENTION_MS = 36 * 60 * 60 * 1000;

export function reconcileParlaySlips(
  backendParlays: Parlay[],
  localSlips: Parlay[],
  nowMs = Date.now(),
): Parlay[] {
  const backendIds = new Set(
    backendParlays.map((parlay) => String(parlay.backendPickId || parlay.id)),
  );

  const retainedLocal = localSlips.filter((parlay) => {
    if (parlay.backendPickId) return false;
    if (parlay.mode === 'PRACTICE') return true;

    const createdAt = Date.parse(parlay.createdAt);
    return Number.isFinite(createdAt) && nowMs - createdAt <= UNSYNCED_RETENTION_MS;
  });

  const seen = new Set<string>();
  return [...backendParlays, ...retainedLocal].filter((parlay) => {
    const key = String(parlay.backendPickId || parlay.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
