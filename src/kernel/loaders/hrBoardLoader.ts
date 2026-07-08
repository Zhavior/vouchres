import { HrBoardRepository } from '../../repositories/HrBoardRepository';
import type { HrBoardContract } from '../contracts/hrBoard';

const PREVIEW_LIMIT = 350;

export async function loadHrBoard(date: string): Promise<HrBoardContract> {
  const today = new Date().toISOString().slice(0, 10);

  const games =
    date === today
      ? await HrBoardRepository.getToday(PREVIEW_LIMIT)
      : await HrBoardRepository.getByDate(date, PREVIEW_LIMIT);

  return {
    games,
    date,
    loadedAt: new Date().toISOString(),
  };
}
