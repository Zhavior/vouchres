import type { Parlay } from '../../types';

export interface ResultsAuroraSummary {
  total: number;
  won: number;
  lost: number;
  pending: number;
  voids: number;
  settled: number;
  winRate: number | null;
  synced: number;
  localOnly: number;
  committedBeforeOutcome: number;
}

function hasBackendRecord(parlay: Parlay): boolean {
  return parlay.backendSyncState === 'synced' && Boolean(parlay.backendPickId);
}

export function buildResultsAuroraSummary(parlays: readonly Parlay[]): ResultsAuroraSummary {
  const won = parlays.filter((parlay) => parlay.status === 'WON').length;
  const lost = parlays.filter((parlay) => parlay.status === 'LOST').length;
  const pending = parlays.filter((parlay) => parlay.status === 'PENDING').length;
  const voids = parlays.filter((parlay) => parlay.status === 'VOID').length;
  const settled = won + lost;
  const synced = parlays.filter(hasBackendRecord).length;

  return {
    total: parlays.length,
    won,
    lost,
    pending,
    voids,
    settled,
    winRate: settled > 0 ? Math.round((won / settled) * 100) : null,
    synced,
    localOnly: parlays.length - synced,
    committedBeforeOutcome: parlays.filter((parlay) => Boolean(parlay.trustCommittedAt)).length,
  };
}
