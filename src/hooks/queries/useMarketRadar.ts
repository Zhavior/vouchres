import { useQuery } from '@tanstack/react-query';
import { vouchedgeApi } from '../../api/vouchedgeApi';
import type { MlbMarketRadarResponse } from '../../types/marketRadar';
import { queryKeys } from './queryKeys';

export function useMarketRadar(date?: string) {
  return useQuery<MlbMarketRadarResponse>({
    queryKey: queryKeys.marketRadar(date),
    queryFn: () => vouchedgeApi.mlbMarketRadar(date),
    staleTime: 30_000,
    retry: 1,
  });
}
