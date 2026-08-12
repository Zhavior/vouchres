import type { Parlay } from '../../types';

export interface ResultsRecordSummary {
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

export function buildResultsRecordSummary(parlays: readonly Parlay[]): ResultsRecordSummary {
  const won = parlays.filter((parlay) => parlay.status === 'WON').length;
  const lost = parlays.filter((parlay) => parlay.status === 'LOST').length;
  const settled = won + lost;
  const synced = parlays.filter((parlay) => parlay.backendSyncState === 'synced' && Boolean(parlay.backendPickId)).length;

  return {
    total: parlays.length,
    won,
    lost,
    pending: parlays.filter((parlay) => parlay.status === 'PENDING').length,
    voids: parlays.filter((parlay) => parlay.status === 'VOID').length,
    settled,
    winRate: settled > 0 ? Math.round((won / settled) * 100) : null,
    synced,
    localOnly: parlays.length - synced,
    committedBeforeOutcome: parlays.filter((parlay) => Boolean(parlay.trustCommittedAt)).length,
  };
}
