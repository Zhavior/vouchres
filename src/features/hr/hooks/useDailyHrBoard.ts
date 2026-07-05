import { useCallback } from "react";
import { HrBoardRepository } from "../../../repositories/HrBoardRepository";
import { useVouchResource } from "./useVouchResource";

const PREVIEW_LIMIT = 999;
const REFRESH_MS = import.meta.env.DEV ? 120_000 : 60_000;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function useDailyHrBoard(date: string) {
  const isToday = date === todayISO();

  const fetcher = useCallback(
    () =>
      isToday
        ? HrBoardRepository.getToday(PREVIEW_LIMIT)
        : HrBoardRepository.getByDate(date, PREVIEW_LIMIT),
    [date, isToday]
  );

  return useVouchResource({
    cacheKey: `hr-board:${date}`,
    refreshMs: isToday ? REFRESH_MS : null,
    staleMs: REFRESH_MS,
    fetcher,
  });
}
