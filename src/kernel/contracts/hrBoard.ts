import type { HrBoardResponse } from '../../types/hrBoard';

/** Daily HR board payload from the API, plus client load metadata. */
export type HrBoardContract = HrBoardResponse & {
  loadedAt: string;
};
