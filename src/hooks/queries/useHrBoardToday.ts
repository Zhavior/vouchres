import { useQuery } from '@tanstack/react-query';
import { vouchedgeApi } from '../../api/vouchedgeApi';
import type { HrBoardResponse } from '../../types/hrBoard';
import { queryKeys } from './queryKeys';

export function useHrBoardToday(previewLimit?: number) {
  return useQuery<HrBoardResponse>({
    queryKey: queryKeys.hrBoardToday(previewLimit),
    queryFn: () => vouchedgeApi.hrBoardToday(previewLimit),
    staleTime: 60_000,
  });
}
