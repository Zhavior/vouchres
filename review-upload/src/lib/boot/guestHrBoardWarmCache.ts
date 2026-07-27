import { bootDataStore } from './bootDataStore';
import { queryClient } from '../queryClient';
import { queryKeys } from '../../hooks/queries/queryKeys';
import { todayISO } from '../../hooks/queries/hrBoardQuery';
import type { HrBoardResponse } from '../../types/hrBoard';

import { HR_BOARD_CANONICAL_FETCH_LIMIT } from '../hrBoardSlice';

const SESSION_KEY = 'vouchedge_guest_hr_warm_v1';
const PREVIEW_LIMIT = HR_BOARD_CANONICAL_FETCH_LIMIT;

let warmInFlight: Promise<void> | null = null;

export function isGuestHrBoardWarmComplete(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  } catch {
    return bootDataStore.has('dailyHrBoard');
  }
}

export function markGuestHrBoardWarmComplete(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, 'true');
  } catch {
    // sessionStorage may be blocked in privacy mode
  }
}

export function seedGuestHrBoardQueryCache(board: HrBoardResponse): void {
  const date = todayISO();
  const updatedAt = bootDataStore.getUpdatedAt('dailyHrBoard') ?? Date.now();
  queryClient.setQueryData(queryKeys.hrBoard(date), board, { updatedAt });
}

/** Session-only warm cache for anonymous HR board visitors. */
export async function warmGuestHrBoardCache(): Promise<void> {
  if (isGuestHrBoardWarmComplete()) return;
  if (bootDataStore.has('dailyHrBoard')) {
    markGuestHrBoardWarmComplete();
    return;
  }
  if (warmInFlight) return warmInFlight;

  warmInFlight = (async () => {
    try {
      const { apiClient } = await import('../apiClient');
      const board = await apiClient.get<HrBoardResponse>(
        '/api/mlb/hr-board/today',
        { previewLimit: PREVIEW_LIMIT },
      );
      if (!board) return;

      bootDataStore.set('dailyHrBoard', board);
      seedGuestHrBoardQueryCache(board);
      markGuestHrBoardWarmComplete();
    } catch {
      // Best-effort warmup — HR page still fetches on its own.
    } finally {
      warmInFlight = null;
    }
  })();

  return warmInFlight;
}

export function resetGuestHrBoardWarmCacheForTests(): void {
  warmInFlight = null;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}
