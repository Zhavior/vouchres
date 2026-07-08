import type { HrBoardGame } from '../../types/hrBoard';

export type HrBoardContract = {
  games: HrBoardGame[];
  date: string;
  loadedAt: string;
};
