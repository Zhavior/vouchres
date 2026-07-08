import type { HrEvent } from '../../types/notifications';

export type HrResultsContract = {
  events: HrEvent[];
  date: string;
  loadedAt: string;
};
