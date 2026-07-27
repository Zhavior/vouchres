import type { Parlay } from '../../types';

export const UNSYNCED_PARLAY_GRACE_MS = 36 * 60 * 60 * 1000;

function identityKeys(parlay: Parlay): string[] {
  return [parlay.backendPickId, parlay.clientRef, parlay.id]
    .filter((value): value is string => Boolean(value))
    .map(String);
}

function isRecent(parlay: Parlay, nowMs: number): boolean {
  const createdAt = Date.parse(parlay.createdAt);
  return Number.isFinite(createdAt) && nowMs - createdAt <= UNSYNCED_PARLAY_GRACE_MS;
}

export function reconcileParlays(
  backendParlays: Parlay[],
  localParlays: Parlay[],
  options: { authenticated: boolean; nowMs?: number },
): Parlay[] {
  if (!options.authenticated) return localParlays;

  const nowMs = options.nowMs ?? Date.now();
  const backendKeys = new Set(backendParlays.flatMap(identityKeys));
  const retainedLocal = localParlays.filter((parlay) => {
    if (identityKeys(parlay).some((key) => backendKeys.has(key))) return false;
    if (parlay.mode === 'PRACTICE') return true;
    if (parlay.backendPickId || parlay.backendSyncState === 'synced') return false;
    return isRecent(parlay, nowMs);
  });

  const seen = new Set<string>();
  return [...backendParlays, ...retainedLocal].filter((parlay) => {
    const keys = identityKeys(parlay);
    if (keys.some((key) => seen.has(key))) return false;
    keys.forEach((key) => seen.add(key));
    return true;
  });
}
