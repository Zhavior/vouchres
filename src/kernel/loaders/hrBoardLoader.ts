import { HrBoardRepository } from '../../repositories/HrBoardRepository';
import type { HrBoardContract } from '../contracts/hrBoard';

const PREVIEW_LIMIT = 120;

export async function loadHrBoard(date: string, previewLimit = PREVIEW_LIMIT): Promise<HrBoardContract> {
  const today = new Date().toISOString().slice(0, 10);

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
