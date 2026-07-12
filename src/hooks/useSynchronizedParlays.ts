import { useMemo } from 'react';
import type { Parlay } from '../types';
import { liveProgressMap, useParlaySlipLiveProgress } from './useParlaySlipLiveProgress';

const MAX_SYNCHRONIZED_LEGS = 50;

export function useSynchronizedParlays(parlays: Parlay[]) {
  const progressLegs = useMemo(() => parlays
    .filter((parlay) => parlay.status === 'PENDING')
    .flatMap((parlay) => parlay.legs.map((leg) => ({
      id: `${parlay.id}:${leg.id}`,
      gamePk: leg.gamePk,
      playerId: leg.playerId,
      marketCode: leg.marketCode,
      statTarget: leg.statTarget,
    })))
    .filter((leg) => leg.gamePk && leg.playerId && leg.marketCode)
    .slice(0, MAX_SYNCHRONIZED_LEGS), [parlays]);

  const progressQuery = useParlaySlipLiveProgress(progressLegs, {
    enabled: progressLegs.length > 0,
    refetchInterval: 20_000,
  });

  const synchronizedParlays = useMemo(() => {
    const progress = liveProgressMap(progressQuery.data);
    return parlays.map((parlay) => ({
      ...parlay,
      legs: parlay.legs.map((leg) => {
        const row = progress.get(`${parlay.id}:${leg.id}`);
        return row?.gameStatus ? { ...leg, gameStatus: row.gameStatus } : leg;
      }),
    }));
  }, [parlays, progressQuery.data]);

  return {
    parlays: synchronizedParlays,
    eligibleLegCount: progressLegs.length,
    isRefreshing: progressQuery.isFetching,
    isStatusUnavailable: progressQuery.isError,
    refresh: progressQuery.refetch,
  };
}
