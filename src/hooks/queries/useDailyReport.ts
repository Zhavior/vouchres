import { useQuery } from '@tanstack/react-query';
import { vouchedgeApi } from '../../api/vouchedgeApi';
import type { DailyMlbReport } from '../../types/mlb';
import { queryKeys } from './queryKeys';
import { todayISO } from './hrBoardQuery';
import { bootDataStore } from '../../lib/boot/bootDataStore';
import { claimEarlyDailyReport } from '../../lib/boot/dailyReportEarlyFetch';

export function useDailyReport(date?: string) {
  const isToday = !date || date === todayISO();
  const bootSeed = isToday ? bootDataStore.get<DailyMlbReport>('dailyReport') : undefined;
  const bootUpdatedAt = isToday ? bootDataStore.getUpdatedAt('dailyReport') : undefined;

  return useQuery<DailyMlbReport>({
    queryKey: queryKeys.dailyReport(date),
    queryFn: async () => {
      if (isToday) {
        const early = claimEarlyDailyReport();
        if (early) {
          try {
            return await early;
          } catch {
            // Fall back to normal API
          }
        }
      }
      return vouchedgeApi.dailyReport(date);
    },
    initialData: bootSeed,
    initialDataUpdatedAt: bootUpdatedAt,
    staleTime: 60_000,
  });
}
