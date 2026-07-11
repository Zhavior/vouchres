import { queryOptions } from "@tanstack/react-query";
import { bootDataStore } from "../../lib/boot/bootDataStore";
import { resolveHrBoardQueryTiming } from "../../lib/hrBoardCache";
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

async function fetchHrBoard(date: string, previewLimit: number): Promise<HrBoardResponse> {
  const { loadHrBoard } = await import('../../kernel/loaders/hrBoardLoader');
  return loadHrBoard(date, previewLimit) as Promise<HrBoardResponse>;
}

export function hrBoardQueryOptions(date: string, previewLimit = 120) {
  const isToday = date === todayISO();
  const { staleTime, gcTime, refetchInterval } = resolveHrBoardQueryTiming();
  const bootSeed = getHrBoardBootInitialData(date);
  const bootUpdatedAt = getHrBoardBootInitialUpdatedAt(date);

  return queryOptions({
    queryKey: queryKeys.hrBoard(date, previewLimit),
    queryFn: () => fetchHrBoard(date, previewLimit),
    initialData: bootSeed,
    initialDataUpdatedAt: bootUpdatedAt,
    staleTime,
    gcTime,
    refetchInterval: isToday ? refetchInterval : false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData,
  });
}
