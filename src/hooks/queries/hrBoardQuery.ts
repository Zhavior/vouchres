import { queryOptions, keepPreviousData } from "@tanstack/react-query";
import { bootDataStore } from "../../lib/boot/bootDataStore";
import { claimEarlyHrBoard } from "../../lib/boot/hrBoardEarlyFetch";
import { resolveHrBoardQueryTiming } from "../../lib/hrBoardCache";
import { HR_BOARD_CANONICAL_FETCH_LIMIT } from "../../lib/hrBoardSlice";
import type { HrBoardResponse } from "../../types/hrBoard";
import { queryKeys } from "./queryKeys";
import { localISODate } from "../../features/hr/utils/localDate";
import { loadHrBoard } from "../../kernel/loaders/hrBoardLoader";

export function todayISO(): string {
  return localISODate();
}

export function getHrBoardBootInitialData(date: string): HrBoardResponse | undefined {
  if (date !== todayISO()) return undefined;
  return bootDataStore.get<HrBoardResponse>("dailyHrBoard");
}

export function getHrBoardBootInitialUpdatedAt(date: string): number | undefined {
  if (date !== todayISO()) return undefined;
  return bootDataStore.getUpdatedAt("dailyHrBoard");
}

async function fetchHrBoard(date: string, signal?: AbortSignal): Promise<HrBoardResponse> {
  if (date === todayISO()) {
    // Started during HTML parse, so this usually resolves with no network wait.
    const early = claimEarlyHrBoard();
    if (early) {
      try {
        return await early;
      } catch {
        // Fall through to the normal loader — the early request is best effort.
      }
    }
  }

  return loadHrBoard(date, HR_BOARD_CANONICAL_FETCH_LIMIT, signal) as Promise<HrBoardResponse>;
}

function shouldRetryHrBoard(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  const candidate = error as { name?: string; code?: string; status?: number };
  if (candidate?.name === 'AbortError' || candidate?.code === 'hr_board_contract_invalid') return false;
  if (typeof candidate?.status === 'number' && candidate.status >= 400 && candidate.status < 500 && candidate.status !== 429) {
    return false;
  }
  return true;
}

export function hrBoardQueryOptions(date: string) {
  const isToday = date === todayISO();
  const { staleTime, gcTime, refetchInterval } = resolveHrBoardQueryTiming();
  const bootSeed = getHrBoardBootInitialData(date);
  const bootUpdatedAt = getHrBoardBootInitialUpdatedAt(date);

  return queryOptions({
    queryKey: queryKeys.hrBoard(date),
    queryFn: ({ signal }) => fetchHrBoard(date, signal),
    initialData: bootSeed,
    initialDataUpdatedAt: bootUpdatedAt,
    staleTime,
    gcTime,
    refetchInterval: isToday ? refetchInterval : false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    placeholderData: keepPreviousData,
    retry: shouldRetryHrBoard,
    retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 4_000),
  });
}
