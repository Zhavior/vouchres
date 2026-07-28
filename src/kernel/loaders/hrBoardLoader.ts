import { HrBoardRepository } from '../../repositories/HrBoardRepository';
import type { HrBoardContract } from '../contracts/hrBoard';
import { localISODate } from '../../features/hr/utils/localDate';

const PREVIEW_LIMIT = 120;

export async function loadHrBoard(
  date: string,
  previewLimit = PREVIEW_LIMIT,
  signal?: AbortSignal,
): Promise<HrBoardContract> {
  const today = localISODate();

  const response =
    date === today
      ? await HrBoardRepository.getToday(previewLimit, signal)
      : await HrBoardRepository.getByDate(date, previewLimit, signal);

  return {
    ...response,
    date: response.date ?? date,
    loadedAt: new Date().toISOString(),
  };
}
