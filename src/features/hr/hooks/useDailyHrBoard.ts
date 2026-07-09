import { useCallback } from "react";
import { loadHrBoard } from "../../../kernel";
import { useVouchResource } from "./useVouchResource";

const REFRESH_MS = import.meta.env.DEV ? 120_000 : 90_000;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function useDailyHrBoard(date: string) {
  const isToday = date === todayISO();

  const fetcher = useCallback(
    () => loadHrBoard(date),
    [date]
  );

  return useVouchResource({
    cacheKey: `hr-board:${date}`,
    refreshMs: isToday ? REFRESH_MS : null,
    staleMs: REFRESH_MS,
    fetcher,
  });
}
