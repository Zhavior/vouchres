import { useQuery } from '@tanstack/react-query';
import type { HrBoardResponse } from '../../types/hrBoard';
import { sliceHrBoardByPreviewLimit } from '../../lib/hrBoardSlice';
import { hrBoardQueryOptions, todayISO } from './hrBoardQuery';

export function useHrBoardToday(previewLimit?: number) {
  return useQuery<HrBoardResponse, Error, HrBoardResponse>({
    ...hrBoardQueryOptions(todayISO()),
    select: previewLimit
      ? (data) => sliceHrBoardByPreviewLimit(data, previewLimit)
      : (data) => sliceHrBoardByPreviewLimit(data, 120),
  });
}
