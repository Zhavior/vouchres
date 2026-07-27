import { useQuery } from '@tanstack/react-query';
import { vouchedgeApi } from '../../api/vouchedgeApi';
import type { DailyMlbReport } from '../../types/mlb';
import { queryKeys } from './queryKeys';

export function useDailyReport(date?: string) {
  return useQuery<DailyMlbReport>({
    queryKey: queryKeys.dailyReport(date),
    queryFn: () => vouchedgeApi.dailyReport(date),
    staleTime: 60_000,
  });
}
