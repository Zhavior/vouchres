import { cachedJsonFetch } from '../../../lib/clientApiCache';
import type { EdgeIslandData } from '../types/edgeIslandData';

export async function getEdgeIslandData(): Promise<EdgeIslandData> {
  const [daily, board, notifications] = await Promise.allSettled([
    cachedJsonFetch<any>('/api/mlb/reports/daily', {}, 60_000),
    cachedJsonFetch<any>('/api/mlb/hr-board/today?previewLimit=25', {}, 120_000),
    cachedJsonFetch<any>('/api/notifications', {}, 30_000),
  ]);

  return {
    summary: daily.status === 'fulfilled' ? daily.value : null,
    favorites: [],
    hrBoard:
      board.status === 'fulfilled'
        ? board.value.rows ?? board.value.data?.rows ?? []
        : [],
    notifications:
      notifications.status === 'fulfilled'
        ? notifications.value.notifications ?? notifications.value.items ?? []
        : [],
    meta: {
      loadedAt: new Date().toISOString(),
    },
  };
}
