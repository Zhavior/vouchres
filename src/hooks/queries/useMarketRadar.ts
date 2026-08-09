import { useQuery } from '@tanstack/react-query';
import { vouchedgeApi } from '../../api/vouchedgeApi';
import type { MarketRadarResponse } from '../../types/marketRadar';
import { queryKeys } from './queryKeys';

export function useMarketRadar(date?: string) {
  return useQuery<MarketRadarResponse>({
    queryKey: queryKeys.marketRadar(date),
    queryFn: () => vouchedgeApi.marketRadar(date),
    staleTime: 30_000,
    retry: 1,
  });
}
