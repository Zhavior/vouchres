import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { vouchedgeApi } from '../../api/vouchedgeApi';
import type { LiveAtBatSnapshot } from '../../types/liveAtBat';
import { queryKeys } from './queryKeys';

/** Fast poll while game is in progress; slower when between at-bats or final. */
export const LIVE_AT_BAT_POLL_LIVE_MS = 6_000;
export const LIVE_AT_BAT_POLL_IDLE_MS = 8_000;
export const LIVE_AT_BAT_POLL_FINAL_MS = 60_000;
export const LIVE_AT_BAT_STALE_MS = 4_500;

function isFinalStatus(status: string | undefined): boolean {
  return /final|completed|game over/i.test(status ?? '');
}

function isLiveInProgress(snap: LiveAtBatSnapshot | undefined): boolean {
  if (!snap) return true;
  if (isFinalStatus(snap.status)) return false;
  const status = snap.status.toLowerCase();
  return /progress|live|in play/.test(status) || snap.play != null;
}

function resolvePollMs(snap: LiveAtBatSnapshot | undefined): number {
  if (isFinalStatus(snap?.status)) return LIVE_AT_BAT_POLL_FINAL_MS;
  if (isLiveInProgress(snap)) return LIVE_AT_BAT_POLL_LIVE_MS;
  return LIVE_AT_BAT_POLL_IDLE_MS;
}

export function useLiveAtBat(gamePk: number, enabled = true) {
  return useQuery<LiveAtBatSnapshot>({
    queryKey: queryKeys.liveAtBat(gamePk),
    queryFn: () => vouchedgeApi.liveAtBat(gamePk),
    enabled: enabled && gamePk > 0,
    staleTime: LIVE_AT_BAT_STALE_MS,
    refetchOnMount: true,
    refetchInterval: (query) => resolvePollMs(query.state.data),
    placeholderData: keepPreviousData,
    retry: 2,
  });
}

export function liveAtBatPollLabel(snap: LiveAtBatSnapshot | undefined): string {
  const ms = resolvePollMs(snap);
  return ms >= 60_000 ? '60s' : `${Math.round(ms / 1000)}s`;
}
