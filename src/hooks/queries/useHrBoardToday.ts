import { useQuery } from '@tanstack/react-query';
import type { HrBoardResponse } from '../../types/hrBoard';
import { hrBoardQueryOptions, todayISO } from './hrBoardQuery';

export function useHrBoardToday(previewLimit?: number) {
  const limit = previewLimit ?? 120;
  return useQuery<HrBoardResponse>(hrBoardQueryOptions(todayISO(), limit));
}
