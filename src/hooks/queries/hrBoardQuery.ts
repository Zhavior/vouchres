import { queryOptions } from "@tanstack/react-query";
import { vouchedgeApi } from "../../api/vouchedgeApi";
import { bootDataStore } from "../../lib/boot/bootDataStore";
import { resolveHrBoardQueryTiming } from "../../lib/hrBoardCache";
import type { HrBoardResponse } from "../../types/hrBoard";
import { queryKeys } from "./queryKeys";

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
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
  if (date === todayISO()) {
    return vouchedgeApi.hrBoardToday(previewLimit);
  }
  return vouchedgeApi.hrBoardByDate(date, previewLimit);
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
