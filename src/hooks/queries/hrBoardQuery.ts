import { queryOptions } from "@tanstack/react-query";
import { bootDataStore } from "../../lib/boot/bootDataStore";
import { resolveHrBoardQueryTiming } from "../../lib/hrBoardCache";
import { HR_BOARD_CANONICAL_FETCH_LIMIT } from "../../lib/hrBoardSlice";
import type { HrBoardResponse } from "../../types/hrBoard";
import { queryKeys } from "./queryKeys";
import { localISODate } from "../../features/hr/utils/localDate";

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

async function fetchHrBoard(date: string): Promise<HrBoardResponse> {
  const { loadHrBoard } = await import('../../kernel/loaders/hrBoardLoader');
  return loadHrBoard(date, HR_BOARD_CANONICAL_FETCH_LIMIT) as Promise<HrBoardResponse>;
}

export function hrBoardQueryOptions(date: string) {
  const isToday = date === todayISO();
  const { staleTime, gcTime, refetchInterval } = resolveHrBoardQueryTiming();
  const bootSeed = getHrBoardBootInitialData(date);
  const bootUpdatedAt = getHrBoardBootInitialUpdatedAt(date);

  return queryOptions({
    queryKey: queryKeys.hrBoard(date),
    queryFn: () => fetchHrBoard(date),
    initialData: bootSeed,
    initialDataUpdatedAt: bootUpdatedAt,
    staleTime,
    gcTime,
    refetchInterval: isToday ? refetchInterval : false,
    refetchOnMount: false,
    // Keep prior data only for the same slate date — never show yesterday while today loads.
    placeholderData: (previousData) =>
      previousData && previousData.date === date ? previousData : undefined,
  });
}
