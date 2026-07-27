import { vouchedgeApi } from '../../api/vouchedgeApi';
import type { HrResultsContract } from '../contracts/hrResults';

export async function loadHrResults(date: string): Promise<HrResultsContract> {
  const today = new Date().toISOString().slice(0, 10);

  const response =
    date === today
      ? await vouchedgeApi.hrFeedToday()
      : await vouchedgeApi.hrFeedByDate(date);

  return {
    events: response.events ?? [],
    date,
    loadedAt: new Date().toISOString(),
  };
}
