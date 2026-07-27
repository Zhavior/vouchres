import { HrBoardRepository } from '../../repositories/HrBoardRepository';
import type { HrBoardContract } from '../contracts/hrBoard';
import { localISODate } from '../../features/hr/utils/localDate';

const PREVIEW_LIMIT = 120;

export async function loadHrBoard(date: string, previewLimit = PREVIEW_LIMIT): Promise<HrBoardContract> {
  const today = localISODate();

  const response =
    date === today
      ? await HrBoardRepository.getToday(previewLimit)
      : await HrBoardRepository.getByDate(date, previewLimit);

  return {
    ...response,
    date: response.date ?? date,
    loadedAt: new Date().toISOString(),
  };
}
